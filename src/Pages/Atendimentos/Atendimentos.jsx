import { useState, useEffect, useCallback } from "react";
import "./Atendimentos.css";
import { STATUS_OPTIONS, STATUS_VALUE, STATUS_LABEL, STATUS_COLORS } from "./constants";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import AtendimentoModal from "./Componentes/atendimentomodal";

const STAT_ICONS = [
  { icon: "ti-calendar-event", bg: "#E4F6F8", color: "#0a9db2" },
  { icon: "ti-circle-check", bg: "#EAF3DE", color: "#3B6D11" },
  { icon: "ti-checkbox", bg: "#EEEDFE", color: "#534AB7" },
  { icon: "ti-calendar-x", bg: "#FEE2E2", color: "#B91C1C" },
];

// statistics vem como dict[str, float|int] genérico do backend;
// aqui só transformamos a chave em um rótulo legível.
function formatStatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatValue(key, value) {
  if (/price|valor|receita|revenue/i.test(key)) {
    return `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  }
  return Number(value).toLocaleString("pt-BR");
}

export default function Atendimentos() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [patientSearch, setPatientSearch] = useState("");
  const [dentistSearch, setDentistSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        page_size: pageSize,
        ...(patientSearch && { patient: patientSearch }),
        ...(dentistSearch && { dentist: dentistSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });
      // rota conforme router: prefix "/appointments" + path "/appointments/table"
      const r = await fetch(`${API_URL}/appointments/appointments/table?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setAppointments(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
      setStatistics(data.statistics ?? {});
    } catch {
      showToast("Erro ao carregar atendimentos.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, page, patientSearch, dentistSearch, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // reseta pra página 1 sempre que algum filtro mudar
  useEffect(() => {
    setPage(1);
  }, [patientSearch, dentistSearch, statusFilter, startDate, endDate]);

  function openCreate() {
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(id) {
    setEditId(id);
    setModalOpen(true);
  }

  function openDelete(id) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API_URL}/appointments/${deleteId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      showToast("Atendimento excluído.");
      setDeleteOpen(false);
      await loadAppointments();
    } catch {
      showToast("Erro ao excluir.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleConfirm(id) {
    try {
      const r = await fetch(`${API_URL}/appointments/${id}/confirm`, {
        method: "PATCH",
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      showToast("Atendimento confirmado!");
      await loadAppointments();
    } catch {
      showToast("Erro ao confirmar atendimento.", "error");
    }
  }

  async function handleSaved(message) {
    if (!message) {
      showToast("Erro ao salvar atendimento.", "error");
      return;
    }
    showToast(message);
    setModalOpen(false);
    await loadAppointments();
  }

  const statEntries = Object.entries(statistics).slice(0, 4);

  return (
    <div className="proc-page">
      <div className="proc-header">
        <div>
          <h1 className="proc-title">Atendimentos</h1>
          <p className="proc-subtitle">Gerencie os atendimentos da sua clínica</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Novo atendimento
        </button>
      </div>

      <div className="stats-grid">
        {statEntries.length > 0 ? (
          statEntries.map(([key, value], i) => {
            const icon = STAT_ICONS[i % STAT_ICONS.length];
            return (
              <div className="stat-card" key={key}>
                <div className="stat-header">
                  <div className="stat-icon" style={{ background: icon.bg }}>
                    <i className={`ti ${icon.icon}`} style={{ color: icon.color }} aria-hidden="true" />
                  </div>
                  <span className="stat-label">{formatStatLabel(key)}</span>
                </div>
                <div className="stat-value">{formatStatValue(key, value)}</div>
              </div>
            );
          })
        ) : (
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ background: "#E4F6F8" }}>
                <i className="ti ti-calendar-event" style={{ color: "#0a9db2" }} aria-hidden="true" />
              </div>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-value">{total}</div>
            <div className="stat-sub">atendimentos no período</div>
          </div>
        )}
      </div>

      <div className="proc-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por paciente..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
        </div>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por dentista..."
            value={dentistSearch}
            onChange={(e) => setDentistSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((label) => (
            <option key={label} value={STATUS_VALUE[label]}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="filter-select"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="filter-select"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="table-loading">Carregando atendimentos...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Nenhum atendimento encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Dentista</th>
                <th>Data / Hora</th>
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => {
                const style = STATUS_COLORS[a.status] ?? STATUS_COLORS.SCHEDULED;
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="proc-name">{a.pacient_name}</div>
                      {a.confirmation_message_sent && (
                        <div className="proc-desc">Confirmação enviada</div>
                      )}
                    </td>
                    <td>{a.dentist_name}</td>
                    <td>{a.time_day}</td>
                    <td className="proc-price">
                      R$ {Number(a.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {a.status === STATUS_VALUE.Agendado && (
                          <button
                            className="btn-icon"
                            onClick={() => handleConfirm(a.id)}
                            title="Confirmar"
                          >
                            ✅
                          </button>
                        )}
                        <button className="btn-icon" onClick={() => openEdit(a.id)} title="Editar">
                          ✏️
                        </button>
                        <button className="btn-icon del" onClick={() => openDelete(a.id)} title="Excluir">
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

      <AtendimentoModal
        open={modalOpen}
        editId={editId}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        token={token}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Excluir atendimento"
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
