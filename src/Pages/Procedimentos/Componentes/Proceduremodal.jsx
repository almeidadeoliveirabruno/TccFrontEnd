import { useState, useEffect } from "react";
import { CATEGORIES, EMPTY_FORM } from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";

export default function ProcedureModal({ open, editProc, onClose, onSaved, token }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editProc
          ? {
              name: editProc.name,
              description: editProc.description ?? "",
              category: editProc.category,
              price: String(editProc.price),
              duration: String(editProc.duration),
            }
          : EMPTY_FORM
      );
      setErrors({});
    }
  }, [open, editProc]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Campo obrigatório";
    if (!form.category) e.category = "Selecione uma categoria";
    if (form.price === "" || isNaN(Number(form.price))) e.price = "Campo obrigatório";
    if (form.duration === "" || isNaN(Number(form.duration))) e.duration = "Campo obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseFloat(form.price),
      duration: parseInt(form.duration),
    };
    try {
      const url = editProc
        ? `${API_URL}/procedures/${editProc.id}`
        : `${API_URL}/procedures/`;
      const method = editProc ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      if (r.status === 409) {
        setErrors({ name: "Já existe um procedimento com esse nome" });
        return;
      }
      if (!r.ok) throw new Error();
      onSaved(editProc ? "Procedimento atualizado!" : "Procedimento criado!");
    } catch {
      onSaved(null);
    } finally {
      setLoading(false);
    }
  }

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function toggleCat(cat) {
    setForm((f) => ({ ...f, category: f.category === cat ? "" : cat }));
    setErrors((err) => ({ ...err, category: undefined }));
  }

  return (
    <div
      className={`modal-overlay ${open ? "open" : ""}`}
      onClick={(e) => e.target.classList.contains("modal-overlay") && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {editProc ? "Editar procedimento" : "Novo procedimento"}
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">
            Nome <span className="req">*</span>
          </label>
          <input
            className={`form-input ${errors.name ? "input-error" : ""}`}
            value={form.name}
            onChange={set("name")}
            placeholder="Ex: Limpeza dental"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea
            className="form-textarea"
            value={form.description}
            onChange={set("description")}
            placeholder="Descrição opcional"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Categoria <span className="req">*</span>
          </label>
          <div className={`cat-grid ${errors.category ? "cat-error" : ""}`}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cat-chip ${form.category === cat ? "selected" : ""}`}
                onClick={() => toggleCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && (
            <span className="form-error">{errors.category}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Preço (R$) <span className="req">*</span>
            </label>
            <input
              className={`form-input ${errors.price ? "input-error" : ""}`}
              type="number"
              min="0"
              step="10.00"
              value={form.price}
              onChange={set("price")}
              placeholder="0,00"
            />
            {errors.price && <span className="form-error">{errors.price}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Duração (min) <span className="req">*</span>
            </label>
            <input
              className={`form-input ${errors.duration ? "input-error" : ""}`}
              type="number"
              step="5"
              min="5"
              value={form.duration}
              onChange={set("duration")}
              placeholder="60"
            />
            {errors.duration && (
              <span className="form-error">{errors.duration}</span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}