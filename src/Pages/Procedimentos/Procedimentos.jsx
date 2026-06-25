import { useState, useEffect, useCallback } from "react";
import "./Procedimentos.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const CATEGORIES = [
  "Preventivo",
  "Restaurador",
  "Cirúrgico",
  "Estético",
  "Ortodôntico",
  "Prótese",
  "Endodontia",
  "Outro",
];

const CAT_COLORS = {
  Preventivo:   { bg: "#E4F6F8", color: "#0a9db2" },
  Restaurador:  { bg: "#E6F1FB", color: "#185FA5" },
  "Cirúrgico":  { bg: "#FBEAF0", color: "#993556" },
  "Estético":   { bg: "#EEEDFE", color: "#534AB7" },
  "Ortodôntico":{ bg: "#FAEEDA", color: "#854F0B" },
  "Prótese":    { bg: "#EAF3DE", color: "#3B6D11" },
  Endodontia:   { bg: "#FAECE7", color: "#993C1D" },
  Outro:        { bg: "#F1EFE8", color: "#5F5E5A" },
};

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "",
  price: "",
  duration: "",
};

function useAuth() {
  return { token: localStorage.getItem("token") };
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }) {
  return (
    <div className={`toast ${type} ${visible ? "show" : ""}`}>
      {message}
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
function DeleteModal({ open, loading, onConfirm, onCancel }) {
  return (
    <div
      className={`modal-overlay ${open ? "open" : ""}`}
      onClick={(e) => e.target.classList.contains("modal-overlay") && onCancel()}
    >
      <div className="confirm-box">
        <h3>Excluir procedimento</h3>
        <p>Tem certeza? Esta ação não pode ser desfeita.</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Procedure modal (create / edit) ─────────────────────────────────────────
function ProcedureModal({ open, editProc, onClose, onSaved, token }) {
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Procedimentos() {
  const { token } = useAuth();
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editProc, setEditProc] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/procedures/`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      setProcedures(await r.json());
    } catch {
      showToast("Erro ao carregar procedimentos.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  function openCreate() {
    setEditProc(null);
    setModalOpen(true);
  }

  function openEdit(proc) {
    setEditProc(proc);
    setModalOpen(true);
  }

  function openDelete(id) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API_URL}/procedures/${deleteId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      showToast("Procedimento excluído.");
      setDeleteOpen(false);
      await loadProcedures();
    } catch {
      showToast("Erro ao excluir.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSaved(message) {
    if (!message) {
      showToast("Erro ao salvar procedimento.", "error");
      return;
    }
    showToast(message);
    setModalOpen(false);
    await loadProcedures();
  }

  const filtered = procedures.filter(
    (p) =>
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())) &&
      (!catFilter || p.category === catFilter)
  );

  const prices = procedures.map((p) => p.price);
  const avg = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const uniqueCats = [...new Set(procedures.map((p) => p.category))].length;

  return (
    <div className="proc-page">
      <div className="proc-header">
        <div>
          <h1 className="proc-title">Procedimentos</h1>
          <p className="proc-subtitle">Gerencie os procedimentos da sua clínica</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Novo procedimento
        </button>
      </div>

      <div className="stats-grid">
  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-icon" style={{ background: "#E4F6F8" }}>
        <i className="ti ti-clipboard-list" style={{ color: "#0a9db2" }} aria-hidden="true" />
      </div>
      <span className="stat-label">Total</span>
    </div>
    <div className="stat-value">{procedures.length}</div>
    <div className="stat-sub">procedimentos cadastrados</div>
  </div>

  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-icon" style={{ background: "#EEEDFE" }}>
        <i className="ti ti-layout-grid" style={{ color: "#534AB7" }} aria-hidden="true" />
      </div>
      <span className="stat-label">Categorias</span>
    </div>
    <div className="stat-value">{uniqueCats}</div>
    <div className="stat-sub">em uso ativo</div>
  </div>

  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-icon" style={{ background: "#EAF3DE" }}>
        <i className="ti ti-chart-line" style={{ color: "#3B6D11" }} aria-hidden="true" />
      </div>
      <span className="stat-label">Ticket médio</span>
    </div>
    <div className="stat-value">R$ {avg.toLocaleString("pt-BR")}</div>
    <div className="stat-sub">valor médio</div>
  </div>

  <div className="stat-card">
    <div className="stat-header">
      <div className="stat-icon" style={{ background: "#FAEEDA" }}>
        <i className="ti ti-trophy" style={{ color: "#854F0B" }} aria-hidden="true" />
      </div>
      <span className="stat-label">Mais caro</span>
    </div>
    <div className="stat-value">R$ {max.toLocaleString("pt-BR")}</div>
    <div className="stat-sub">procedimento premium</div>
  </div>
</div>

      <div className="proc-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="table-loading">Carregando procedimentos...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Nenhum procedimento encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Duração</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const style = CAT_COLORS[p.category] ?? CAT_COLORS.Outro;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="proc-name">{p.name}</div>
                      {p.description && (
                        <div className="proc-desc">{p.description}</div>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {p.category}
                      </span>
                    </td>
                    <td className="proc-price">
                      R${" "}
                      {Number(p.price).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="proc-duration">{p.duration} min</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(p)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon del"
                          onClick={() => openDelete(p.id)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ProcedureModal
        open={modalOpen}
        editProc={editProc}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        token={token}
      />

      <DeleteModal
        open={deleteOpen}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Toast {...toast} />
    </div>
  );
}
