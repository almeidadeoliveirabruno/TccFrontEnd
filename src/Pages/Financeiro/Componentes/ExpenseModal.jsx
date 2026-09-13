import { useState, useEffect } from "react";
import { API_URL, authHeaders } from "../../../utils/api";
import { EXPENSE_CATEGORY_LABELS } from "../constants";

const EMPTY_FORM = {
  description: "",
  category: "",
  amount: "",
  due_date: "",
  notes: "",
};

// Trocar
function mapValidationErrors(detail) {
  const fieldErrors = {};
  if (!Array.isArray(detail)) return fieldErrors;
  for (const item of detail) {
    const field = item.loc?.[item.loc.length - 1];
    if (field && typeof field === "string") {
      fieldErrors[field] = item.msg;
    }
  }
  return fieldErrors;
}

export default function ExpenseModal({
  open,
  onClose,
  onSaved,
  token,
  editExpense = null,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editExpense) {
      setForm({
        description: editExpense.description ?? "",
        category: editExpense.category ?? "",
        amount: String(editExpense.amount ?? ""),
        due_date: editExpense.due_date ?? "",
        notes: editExpense.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editExpense]);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function validate() {
    const e = {};
    if (!form.description.trim()) e.description = "Campo obrigatório";
    if (!form.category) e.category = "Selecione uma categoria";

    const amountNumber = Number(form.amount);
    if (!form.amount || isNaN(amountNumber) || amountNumber <= 0) {
      e.amount = "Informe um valor maior que zero";
    }

    if (!form.due_date) e.due_date = "Campo obrigatório";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    const body = {
      description: form.description.trim(),
      category: form.category,
      amount: Number(form.amount),
      due_date: form.due_date,
      notes: form.notes.trim() || null,
    };

    try {
      const url = editExpense
        ? `${API_URL}/expenses/${editExpense.id}`
        : `${API_URL}/expenses`;
      const method = editExpense ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });

      if (r.ok) {
        setForm(EMPTY_FORM);
        onSaved(editExpense ? "Despesa atualizada!" : "Despesa registrada!");
        return;
      }

      const errorBody = await r.json().catch(() => null);

      if (r.status === 422) {
        const fieldErrors = mapValidationErrors(errorBody?.detail);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((err) => ({ ...err, ...fieldErrors }));
        } else {
          onSaved(null, "Dados inválidos. Confira os campos e tente novamente.");
        }
        return;
      }

      const message =
        typeof errorBody?.detail === "string"
          ? errorBody.detail
          : "Erro ao salvar despesa. Tente novamente.";
      onSaved(null, message);
    } catch {
      onSaved(null, "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {editExpense ? "Editar despesa" : "Nova despesa"}
          </div>
          <button className="btn-close" onClick={resetAndClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">
            Descrição <span className="req">*</span>
          </label>
          <input
            className={`form-input ${errors.description ? "input-error" : ""}`}
            value={form.description}
            onChange={set("description")}
            placeholder="Ex: Material odontológico - Dentalclean"
          />
          {errors.description && (
            <span className="form-error">{errors.description}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Categoria <span className="req">*</span>
            </label>
            <select
              className={`filter-select ${errors.category ? "input-error" : ""}`}
              value={form.category}
              onChange={set("category")}
            >
              <option value="">Selecione...</option>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="form-error">{errors.category}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Valor (R$) <span className="req">*</span>
            </label>
            <input
              className={`form-input ${errors.amount ? "input-error" : ""}`}
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={set("amount")}
              placeholder="0,00"
            />
            {errors.amount && (
              <span className="form-error">{errors.amount}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Vencimento <span className="req">*</span>
          </label>
          <input
            className={`form-input ${errors.due_date ? "input-error" : ""}`}
            type="date"
            value={form.due_date}
            onChange={set("due_date")}
          />
          {errors.due_date && (
            <span className="form-error">{errors.due_date}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Observações</label>
          <input
            className="form-input"
            value={form.notes}
            onChange={set("notes")}
            placeholder="Opcional"
          />
        </div>

        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={resetAndClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}