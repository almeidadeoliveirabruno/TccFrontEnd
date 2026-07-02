import { useState, useEffect, useCallback } from "react";
import "./Procedimentos.css";
import { CATEGORIES, CAT_COLORS } from "./constants";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import ProcedureModal from "./Componentes/proceduremodal";

export default function Procedimentos() {
  const { token } = useAuth();
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    averagePrice: 0,
    maxPrice: 0,
    categories: 0,
  });

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
      const params = new URLSearchParams({
        page,
        page_size: pageSize,
        ...(search && { search }),
        ...(catFilter && { category: catFilter }),
      });
      const r = await fetch(`${API_URL}/procedures?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setProcedures(data.items);
      setTotalPages(data.total_pages);
      setStats({
        total: data.statistics.total_procedures,
        averagePrice: data.statistics.average_price,
        maxPrice: data.statistics.max_price,
        categories: data.statistics.unique_categories,
      });
    } catch {
      showToast("Erro ao carregar procedimentos.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, catFilter]);

useEffect(() => {
  loadProcedures();
}, [loadProcedures]);

// reseta pra página 1 sempre que o filtro mudar
useEffect(() => {
  setPage(1);
}, [search, catFilter]);

  // const loadProcedures = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const r = await fetch(`${API_URL}/procedures?page=${page}&page_size=${pageSize}`, {
  //       headers: authHeaders(token),
  //     });
  //     if (!r.ok) throw new Error();
  //     const data = await r.json();
  //     console.log(data)
  //     setProcedures(data.items);
  //     setTotalPages(data.total_pages);
  //     setStats({
  //       total: data.statistics.total_procedures,
  //       averagePrice: data.statistics.average_price,
  //       maxPrice: data.statistics.max_price,
  //       categories: data.statistics.unique_categories,
  //     });


  //   } catch {
  //     showToast("Erro ao carregar procedimentos.", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [token, page]);

  // useEffect(() => {
  //   loadProcedures();
  // }, [loadProcedures]);

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
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">procedimentos cadastrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#EEEDFE" }}>
              <i className="ti ti-layout-grid" style={{ color: "#534AB7" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Categorias</span>
          </div>
          <div className="stat-value">{stats.categories}</div>
          <div className="stat-sub">em uso ativo</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#EAF3DE" }}>
              <i className="ti ti-chart-line" style={{ color: "#3B6D11" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Ticket médio</span>
          </div>
          <div className="stat-value"> 
            R$ {Number(stats.averagePrice).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}</div>
          <div className="stat-sub">valor médio</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#FAEEDA" }}>
              <i className="ti ti-trophy" style={{ color: "#854F0B" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Mais caro</span>
          </div>
          <div className="stat-value">R$ {Number(stats.maxPrice).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}</div>
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
        ) : stats.total === 0 ? (
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
              {procedures .map((p) => {
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
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Editar">
                          ✏️
                        </button>
                        <button className="btn-icon del" onClick={() => openDelete(p.id)} title="Excluir">
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

      <div className="pagination">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <i className="ti ti-chevron-left"></i>
        </button>

        <span className="page-counter">
          Página <strong>{page}</strong> de <strong>{totalPages}</strong>
        </span>

        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          <i className="ti ti-chevron-right"></i>
        </button>
      </div>

      <ProcedureModal
        open={modalOpen}
        editProc={editProc}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        token={token}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Excluir procedimento"
        loading={deleteLoading}
        confirmLabel="Excluir"
        loadingLabel="Excluindo..."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Toast {...toast} />
    </div>
  );
}