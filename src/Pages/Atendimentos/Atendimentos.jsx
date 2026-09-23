import { useState, useEffect, useCallback } from "react";
import "./Atendimentos.css";
import { STATUS_OPTIONS, STATUS_VALUE, STATUS_LABEL, STATUS_COLORS } from "./constants";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import Toast from "../../components/Toast/Toast";
import AppointmentDetailModal from "./Componentes/AppointmentDetailModal";
import ReceivableModal from "./Componentes/ReceivableModal";

// cor do ícone de cifrão de acordo com o status do receivable daquela consulta
const RECEIVABLE_ICON_COLOR = {
  pago: "#16a34a",
  pendente: "#f59e0b",
  parcial: "#f59e0b",
  cancelado: "#dc2626",
};

// exibe "—" enquanto os dados ainda não chegaram, em vez de 0 ou undefined
function show(value, { money = false } = {}) {
  if (value === undefined || value === null) return "—";
  if (money) {
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

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const [payOpen, setPayOpen] = useState(false);
  const [payAppointment, setPayAppointment] = useState(null);
  // status do receivable de cada consulta, indexado por appointment id
  // -- alimenta a cor do ícone de cifrão na tabela
  const [receivableStatus, setReceivableStatus] = useState({});

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadReceivableStatus = useCallback(
    async (appointmentId) => {
      try {
        const r = await fetch(`${API_URL}/receivables/by-appointment/${appointmentId}`, {
          headers: authHeaders(token),
        });
        if (!r.ok) return;
        const data = await r.json();
        setReceivableStatus((prev) => ({ ...prev, [appointmentId]: data.status }));
      } catch {
        // silencioso -- ícone fica neutro (cinza) se a busca falhar
      }
    },
    [token],
  );

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
      const r = await fetch(`${API_URL}/appointments/table?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      const items = data.items ?? [];
      setAppointments(items);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
      setStatistics(data.statistics ?? {});
      // busca o status financeiro de cada linha da página atual
      items.forEach((a) => loadReceivableStatus(a.id));
    } catch {
      showToast("Erro ao carregar atendimentos.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, page, patientSearch, dentistSearch, statusFilter, startDate, endDate, loadReceivableStatus]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // reseta pra página 1 sempre que algum filtro mudar
  useEffect(() => {
    setPage(1);
  }, [patientSearch, dentistSearch, statusFilter, startDate, endDate]);

  function openDetail(id) {
    setDetailId(id);
    setDetailOpen(true);
  }

  function openPay(appointment) {
    setPayAppointment(appointment);
    setPayOpen(true);
  }

  async function handleSaved(message) {
    if (!message) {
      showToast("Erro ao salvar atendimento.", "error");
      return;
    }
    showToast(message);
    setDetailOpen(false);
    await loadAppointments();
  }

  async function handlePaySaved(message) {
    if (!message) {
      showToast("Erro ao salvar pagamento.", "error");
      return;
    }
    showToast(message);
    setPayOpen(false);
    // só atualiza o status daquela linha -- não precisa recarregar a tabela
    // inteira, pagamento não muda status/valor do atendimento em si
    if (payAppointment) {
      loadReceivableStatus(payAppointment.id);
    }
  }

  return (
    <div className="proc-page">
      <div className="proc-header">
        <div>
          <h1 className="proc-title">Histórico de Atendimentos</h1>
          <p className="proc-subtitle">Gerencie os atendimentos da sua clínica</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#E4F6F8" }}>
              <i className="ti ti-calendar-event" style={{ color: "#0a9db2" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Total de agendamentos</span>
          </div>
          <div className="stat-value">{show(statistics.total_de_agendamentos)}</div>
          <div className="stat-sub">agendamentos realizados</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#FEE2E2" }}>
              <i className="ti ti-calendar-x" style={{ color: "#B91C1C" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Quantidade de faltas</span>
          </div>
          <div className="stat-value">{show(statistics.quantidade_de_faltas)}</div>
          <div className="stat-sub">faltas de pacientes </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#EEEDFE" }}>
              <i className="ti ti-checkbox" style={{ color: "#534AB7" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Pacientes atendidos</span>
          </div>
          <div className="stat-value">{show(statistics.pacientes_atendidos)}</div>
          <div className="stat-sub">diferentes pacientes</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#DCFCE7" }}>
              <i className="ti ti-cash" style={{ color: "#15803D" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Receita</span>
          </div>
          <div className="stat-value">{show(statistics.receita, { money: true })}</div>
          <div className="stat-sub">receita no período</div>
        </div>
      </div>

      <div className="proc-toolbar">
        <div className="search-wrap">
          <span className="filter-label">Paciente</span>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Buscar por paciente..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="search-wrap">
          <span className="filter-label">Dentista</span>
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Buscar por dentista..."
              value={dentistSearch}
              onChange={(e) => setDentistSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="search-wrap">
          <span className="filter-label">Status</span>
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
        </div>

        <div className="search-wrap">
          <span className="filter-label">Início</span>
          <input
            type="date"
            className="filter-select"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="search-wrap">
          <span className="filter-label">Fim</span>
          <input
            type="date"
            className="filter-select"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
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
                const style = STATUS_COLORS[a.status] ?? STATUS_COLORS.agendado;
                const recStatus = receivableStatus[a.id];
                const moneyColor = RECEIVABLE_ICON_COLOR[recStatus] ?? "#9CA3AF";
                const moneyTitle =
                  recStatus === "pago"
                    ? "Pago"
                    : recStatus === "cancelado"
                    ? "Cobrança cancelada"
                    : recStatus === "parcial"
                    ? "Pagamento parcial"
                    : "Registrar pagamento";
                return (
                  <tr key={a.id} onClick={() => openDetail(a.id)} style={{ cursor: "pointer" }}>
                    <td>
                      <div className="proc-name">{a.pacient_name}</div>
                      {a.procedures?.length > 0 && (
                        <div className="proc-desc">{a.procedures.join(", ")}</div>
                      )}
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
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon"
                          onClick={() => openPay(a)}
                          title={moneyTitle}
                        >
                          <i className="ti ti-currency-dollar" style={{ color: moneyColor }} aria-hidden="true" />
                        </button>
                        <button className="btn-icon" onClick={() => openDetail(a.id)} title="Ver detalhes">
                          ✏️
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

      <AppointmentDetailModal
        open={detailOpen}
        appointmentId={detailId}
        onClose={() => setDetailOpen(false)}
        onSaved={handleSaved}
        token={token}
      />

      <ReceivableModal
        open={payOpen}
        appointmentId={payAppointment?.id}
        patientName={payAppointment?.pacient_name}
        dentistName={payAppointment?.dentist_name}
        appointmentTime={payAppointment?.time_day}
        totalPrice={payAppointment?.total_price}
        onClose={() => setPayOpen(false)}
        onSaved={handlePaySaved}
        token={token}
      />

      <Toast {...toast} />
    </div>
  );
}