import { useCallback, useEffect, useMemo, useState } from "react";
import "./Agenda.css";
import {
  CalendarDays,
  CalendarCheck2,
  MessageCircle,
  Users,
} from "lucide-react";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import WeekDatePicker from "./Componentes/WeekDatePicker";
import AgendaBoard from "./Componentes/AgendaBoard";
import AppointmentDetailPanel from "./Componentes/AppointmentDetailPanel";
import AppointmentModal from "./Componentes/AppointmentModal";
import AgendaSettingsModal from "./Componentes/AgendaSettingsModal";
import {
  AGENDA_SELECTED_DENTIST_STORAGE_KEY,
  getConfirmationUi,
  loadAgendaHoursRange,
  saveAgendaHoursRange,
} from "./constants";
import { computeUnavailableRanges, toBackendDayOfWeek, toISODate } from "./utils";

export default function Agenda() {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientMap, setPatientMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedDentistId, setSelectedDentistId] = useState(() => {
    return localStorage.getItem(AGENDA_SELECTED_DENTIST_STORAGE_KEY) || null;
  });

  const [hoursRange, setHoursRange] = useState(() => loadAgendaHoursRange());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSchedules, setActiveSchedules] = useState([]);

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalPreset, setModalPreset] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const isoDate = toISODate(selectedDate);

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadDentists = useCallback(async () => {
    const params = new URLSearchParams({
      page: "1",
      page_size: "100",
      status: "Ativo",
    });
    const r = await fetch(`${API_URL}/dentists?${params}`, {
      headers: authHeaders(token),
    });
    if (!r.ok) throw new Error();
    const data = await r.json();
    setDentists(data.items ?? []);
  }, [token]);

  const loadPatientsIndex = useCallback(async (patientIds) => {
    if (!patientIds.length) {
      setPatientMap({});
      return;
    }
    const params = new URLSearchParams({ page: "1", page_size: "100" });
    const r = await fetch(`${API_URL}/patients?${params}`, {
      headers: authHeaders(token),
    });
    if (!r.ok) return;
    const data = await r.json();
    const map = {};
    for (const p of data.items ?? []) {
      if (patientIds.includes(p.id)) map[p.id] = p;
    }
    setPatientMap(map);
  }, [token]);

  const loadDentistSchedules = useCallback(async (dentistId) => {
    if (!dentistId) {
      setActiveSchedules([]);
      return;
    }
    try {
      const r = await fetch(`${API_URL}/dentists/${dentistId}/schedules`, {
        headers: authHeaders(token),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${body}`);
      }
      const data = await r.json();
      console.log("Expediente carregado para dentist_id", dentistId, data);
      setActiveSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar expediente do dentista:", err);
      setActiveSchedules([]);
    }
  }, [token]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ appointment_date: isoDate });
      const r = await fetch(`${API_URL}/appointments?${params}`, {
        headers: authHeaders(token),
      });
      // if (!r.ok) throw new Error();
      // const data = await r.json();
      // setAppointments(Array.isArray(data) ? data : []);
      // const ids = [...new Set(data.map((a) => a.patient_id))];
      // await loadPatientsIndex(ids);
      const data = await r.json();

      const activeAppointments = Array.isArray(data)
        ? data.filter((apt) => apt.status !== "cancelado")
        : [];

      setAppointments(activeAppointments);

      const ids = [...new Set(activeAppointments.map((a) => a.patient_id))];
      await loadPatientsIndex(ids);
    } catch {
      showToast("Erro ao carregar agendamentos.", "error");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [token, isoDate, loadPatientsIndex]);

  useEffect(() => {
    loadDentists().catch(() => showToast("Erro ao carregar dentistas.", "error"));
  }, [loadDentists]);

  useEffect(() => {
    if (dentists.length === 0) return;
    const stillValid = dentists.some((d) => d.id === selectedDentistId);
    if (!stillValid) {
      handleSelectDentist(dentists[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentists]);

  function handleSelectDentist(dentistId) {
    setSelectedDentistId(dentistId);
    localStorage.setItem(AGENDA_SELECTED_DENTIST_STORAGE_KEY, dentistId);
  }

  useEffect(() => {
    loadDentistSchedules(selectedDentistId);
  }, [selectedDentistId, loadDentistSchedules]);

  const unavailableRanges = useMemo(() => {
    return computeUnavailableRanges(
      activeSchedules,
      toBackendDayOfWeek(selectedDate.getDay()),
      hoursRange.start * 60,
      hoursRange.end * 60,
    );
  }, [activeSchedules, selectedDate, hoursRange]);

  function handleSaveHoursRange(range) {
    setHoursRange(range);
    saveAgendaHoursRange(range);
  }

  useEffect(() => {
    loadAppointments();
    setSelectedCardId(null);
    setDetail(null);
  }, [loadAppointments]);

  const stats = useMemo(() => {
    let confirmed = 0;
    let waiting = 0;
    let pendingMsg = 0;
    for (const apt of appointments) {
      const ui = getConfirmationUi(apt);
      if (ui.key === "confirmed") confirmed += 1;
      else if (ui.key === "waiting") waiting += 1;
      else if (ui.key === "pending") pendingMsg += 1;
    }
    return {
      total: appointments.length,
      confirmed,
      waiting,
      pendingMsg,
      dentists: dentists.length,
    };
  }, [appointments, dentists.length]);

  async function loadDetail(id) {
    setDetailLoading(true);
    try {
      const r = await fetch(`${API_URL}/appointments/${id}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setDetail(data);

      if (!patientMap[data.patient_id]) {
        const pr = await fetch(`${API_URL}/patients/${data.patient_id}`, {
          headers: authHeaders(token),
        });
        if (pr.ok) {
          const patient = await pr.json();
          setPatientMap((m) => ({ ...m, [patient.id]: patient }));
        }
      }
    } catch {
      showToast("Erro ao carregar detalhes.", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function handleSelectAppointment(apt) {
    setSelectedCardId(apt.id);
    loadDetail(apt.id);
  }

  function openCreate(preset = null) {
    setEditId(null);
    setModalPreset(preset);
    setModalOpen(true);
  }

  function openEditFromPanel() {
    if (!detail) return;
    setEditId(detail.id);
    setModalPreset(null);
    setModalOpen(true);
  }

  async function updateAppointmentStatusRequest(id, newStatus) {
    const r = await fetch(`${API_URL}/appointments/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status: newStatus }),
    });
    if (!r.ok) throw new Error();
  }

  async function handleStatusChange(newStatus) {
    if (!detail) return;
    setStatusUpdateLoading(true);
    try {
      await updateAppointmentStatusRequest(detail.id, newStatus);
      showToast("Status do agendamento atualizado.");
      await loadAppointments();
      await loadDetail(detail.id);
    } catch {
      showToast("Não foi possível atualizar o status.", "error");
    } finally {
      setStatusUpdateLoading(false);
    }
  }

  async function handleCancelConfirm() {
    if (!detail) return;
    setCancelLoading(true);
    try {
      await updateAppointmentStatusRequest(detail.id, "cancelado");
      showToast("Agendamento cancelado.");
      setCancelOpen(false);
      await loadAppointments();
      await loadDetail(detail.id);
    } catch {
      showToast("Não foi possível cancelar.", "error");
    } finally {
      setCancelLoading(false);
    }
  }

  const detailPatient = detail ? patientMap[detail.patient_id] : null;
  const detailDentist = detail
    ? dentists.find((d) => d.id === detail.dentist_id)
    : null;

  return (
    <div className="agenda-page">
      <header className="agenda-header">
        <div>
          <h1 className="agenda-title">Agenda</h1>
          <p className="agenda-subtitle">
            Selecione um dentista e gerencie os agendamentos da clínica.
          </p>
        </div>
        <div className="agenda-header-actions">
          <button
            type="button"
            className="agenda-btn-ghost"
            onClick={() => setSettingsOpen(true)}
          >
            Configurações da agenda
          </button>
          <button type="button" className="btn-primary" onClick={() => openCreate()}>
            + Novo agendamento
          </button>
        </div>
      </header>

      <div className="stats-grid agenda-stats">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#ecfeff", color: "#0891b2" }}>
              <CalendarDays size={16} />
            </div>
            <span className="stat-label">Consultas no dia</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">na data selecionada</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
              <CalendarCheck2 size={16} />
            </div>
            <span className="stat-label">Confirmadas</span>
          </div>
          <div className="stat-value">{stats.confirmed}</div>
          <div className="stat-sub">resposta positiva do paciente</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
              <MessageCircle size={16} />
            </div>
            <span className="stat-label">Aguardando</span>
          </div>
          <div className="stat-value">{stats.waiting}</div>
          <div className="stat-sub">mensagem enviada, sem resposta</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>
              <Users size={16} />
            </div>
            <span className="stat-label">Dentistas</span>
          </div>
          <div className="stat-value">{stats.dentists}</div>
          <div className="stat-sub">ativos na clínica · {stats.pendingMsg} sem envio</div>
        </div>
      </div>

      <WeekDatePicker selectedDate={selectedDate} onChangeDate={setSelectedDate} />

      <div className="agenda-main">
        <div className="agenda-board-panel">
          {loading ? (
            <div className="agenda-board-loading">Carregando agenda...</div>
          ) : (
            <AgendaBoard
              dentists={dentists}
              appointments={appointments}
              patientMap={patientMap}
              selectedAppointmentId={selectedCardId}
              onSelectAppointment={handleSelectAppointment}
              onEmptySlotClick={(slot) => openCreate(slot)}
              selectedDentistId={selectedDentistId}
              onSelectDentist={handleSelectDentist}
              dayStart={hoursRange.start}
              dayEnd={hoursRange.end}
              unavailableRanges={unavailableRanges}
              onBlockedSlotClick={() =>
                showToast("Esse horário está fora do expediente do dentista.", "error")
              }
            />
          )}
        </div>

        <AppointmentDetailPanel
          detail={detail}
          patient={detailPatient}
          dentist={detailDentist}
          loading={detailLoading}
          onClose={() => {
            setSelectedCardId(null);
            setDetail(null);
          }}
          onEdit={openEditFromPanel}
          onCancel={() => setCancelOpen(true)}
          onStatusChange={handleStatusChange}
          statusUpdateLoading={statusUpdateLoading}
          cancelLoading={cancelLoading}
        />
      </div>

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          showToast(editId ? "Agendamento atualizado." : "Consulta agendada com sucesso.");
          loadAppointments();
          if (selectedCardId) loadDetail(selectedCardId);
        }}
        token={token}
        selectedDate={selectedDate}
        dentists={dentists}
        editAppointmentId={editId}
        preset={modalPreset}
      />

      <ConfirmModal
        open={cancelOpen}
        title="Cancelar agendamento"
        message="Deseja cancelar esta consulta? O horário ficará disponível na agenda."
        confirmLabel="Cancelar consulta"
        loading={cancelLoading}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelOpen(false)}
      />

      <AgendaSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        range={hoursRange}
        onSave={handleSaveHoursRange}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </div>
  );
}