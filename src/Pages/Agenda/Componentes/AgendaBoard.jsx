import { MessageCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  APPOINTMENT_STATUS,
  DAY_END_HOUR,
  DAY_START_HOUR,
  DENTIST_COLUMN_COLORS,
  getConfirmationUi,
  SLOT_HEIGHT_PX,
  SLOT_MINUTES,
} from "../constants";
import {
  dentistColor,
  dentistInitials,
  formatTimeShort,
  minutesToTimeLabel,
  timeToMinutes,
} from "../utils";

function ConfirmationBadge({ appointment, compact }) {
  const ui = getConfirmationUi(appointment);
  const Icon =
    ui.key === "confirmed"
      ? CheckCircle2
      : ui.key === "canceled"
        ? XCircle
        : ui.key === "waiting"
          ? Clock
          : MessageCircle;

  return (
    <span className={`agenda-confirm-badge tone-${ui.tone} ${compact ? "compact" : ""}`}>
      <Icon size={compact ? 12 : 14} />
      <span>{compact ? ui.shortLabel : ui.label}</span>
    </span>
  );
}

function AppointmentBlock({
  appointment,
  patientName,
  color,
  selected,
  onSelect,
}) {
  const startMin = timeToMinutes(appointment.time_begin);
  const endMin = timeToMinutes(appointment.time_end);
  const gridStart = DAY_START_HOUR * 60;
  const top = ((startMin - gridStart) / SLOT_MINUTES) * SLOT_HEIGHT_PX;
  const height = Math.max(
    ((endMin - startMin) / SLOT_MINUTES) * SLOT_HEIGHT_PX - 4,
    SLOT_HEIGHT_PX * 0.75,
  );
  const statusStyle = APPOINTMENT_STATUS[appointment.status] ?? APPOINTMENT_STATUS.agendado;
  const procedures = (appointment.procedures ?? []).join(", ") || "Consulta";

  return (
    <button
      type="button"
      className={`agenda-appt-block ${selected ? "selected" : ""} status-${appointment.status}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        "--dentist-accent": color,
        borderLeftColor: statusStyle.accent,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(appointment);
      }}
    >
      <div className="agenda-appt-block-main">
        <strong>{patientName ?? "Paciente"}</strong>
        <span>{procedures}</span>
      </div>
      <ConfirmationBadge appointment={appointment} compact />
    </button>
  );
}

export default function AgendaBoard({
  dentists,
  appointments,
  patientMap,
  selectedAppointmentId,
  onSelectAppointment,
  onEmptySlotClick,
}) {
  const totalSlots =
    ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES;
  const boardHeight = totalSlots * SLOT_HEIGHT_PX;

  const timeLabels = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h += 1) {
    timeLabels.push(minutesToTimeLabel(h * 60));
  }

  const byDentist = {};
  for (const d of dentists) byDentist[d.id] = [];
  for (const apt of appointments) {
    if (byDentist[apt.dentist_id]) byDentist[apt.dentist_id].push(apt);
  }

  if (dentists.length === 0) {
    return (
      <div className="agenda-board-empty">
        <p>Nenhum dentista ativo encontrado.</p>
        <span>Cadastre dentistas ativos para visualizar a agenda.</span>
      </div>
    );
  }

  return (
    <div className="agenda-board-wrap">
      <div className="agenda-board">
        <div className="agenda-time-col">
          <div className="agenda-col-header-spacer" />
          <div className="agenda-time-labels" style={{ height: boardHeight }}>
            {timeLabels.map((label) => (
              <span key={label} className="agenda-time-label">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="agenda-dentists-scroll">
          {dentists.map((dentist) => {
            const color = dentistColor(dentist.name, DENTIST_COLUMN_COLORS);
            const columnAppointments = byDentist[dentist.id] ?? [];

            return (
              <div key={dentist.id} className="agenda-dentist-col">
                <div className="agenda-dentist-header">
                  <div
                    className="agenda-dentist-avatar"
                    style={{ background: color }}
                  >
                    {dentistInitials(dentist.name)}
                  </div>
                  <div>
                    <strong>{dentist.name}</strong>
                    <span>{(dentist.specialties ?? []).slice(0, 2).join(" · ") || "Odontologia"}</span>
                  </div>
                </div>

                <div
                  className="agenda-dentist-grid"
                  style={{ height: boardHeight }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const slotIndex = Math.floor(y / SLOT_HEIGHT_PX);
                    const minutes =
                      DAY_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
                    if (minutes >= DAY_END_HOUR * 60) return;
                    onEmptySlotClick?.({
                      dentistId: dentist.id,
                      timeBegin: minutesToTimeLabel(minutes),
                    });
                  }}
                >
                  {Array.from({ length: totalSlots }).map((_, i) => (
                    <div key={i} className="agenda-grid-line" />
                  ))}

                  {columnAppointments.map((apt) => (
                    <AppointmentBlock
                      key={apt.id}
                      appointment={apt}
                      patientName={patientMap[apt.patient_id]?.name}
                      color={color}
                      selected={selectedAppointmentId === apt.id}
                      onSelect={onSelectAppointment}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="agenda-board-legend">
        <span className="agenda-legend-title">Confirmação</span>
        <ConfirmationBadge
          appointment={{ status: "agendado", confirmation_message_sent: false }}
        />
        <ConfirmationBadge
          appointment={{ status: "agendado", confirmation_message_sent: true }}
        />
        <ConfirmationBadge
          appointment={{ status: "confirmado", confirmation_message_sent: true }}
        />
        <ConfirmationBadge
          appointment={{ status: "cancelado", confirmation_message_sent: true }}
        />
        <span className="agenda-legend-hint">
          Horário: {formatTimeShort(`${DAY_START_HOUR}:00`)} – {DAY_END_HOUR}:00 · clique em um horário vazio para agendar
        </span>
      </div>
    </div>
  );
}

export { ConfirmationBadge };
