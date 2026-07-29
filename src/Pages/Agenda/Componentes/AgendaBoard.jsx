import { MessageCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  APPOINTMENT_STATUS,
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
  dayStart,
}) {
  const startMin = timeToMinutes(appointment.time_begin);
  const endMin = timeToMinutes(appointment.time_end);
  const gridStart = dayStart * 60;
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
  selectedDentistId,
  onSelectDentist,
  dayStart,
  dayEnd,
  unavailableRanges = [],
  onBlockedSlotClick,
}) {
  const totalSlots = ((dayEnd - dayStart) * 60) / SLOT_MINUTES;
  const boardHeight = totalSlots * SLOT_HEIGHT_PX;

  const timeLabels = [];
  for (let h = dayStart; h < dayEnd; h += 1) {
    const slotsFromStart = ((h * 60 - dayStart * 60) / SLOT_MINUTES);
    timeLabels.push({
      label: minutesToTimeLabel(h * 60),
      top: slotsFromStart * SLOT_HEIGHT_PX,
    });
  }

  if (dentists.length === 0) {
    return (
      <div className="agenda-board-empty">
        <p>Nenhum dentista ativo encontrado.</p>
        <span>Cadastre dentistas ativos para visualizar a agenda.</span>
      </div>
    );
  }

  const activeDentist =
    dentists.find((d) => d.id === selectedDentistId) ?? dentists[0];
  const activeColor = dentistColor(activeDentist.name, DENTIST_COLUMN_COLORS);
  const columnAppointments = appointments.filter(
    (apt) => apt.dentist_id === activeDentist.id,
  );

  return (
    <div className="agenda-board-wrap">
      <div className="agenda-dentist-tabs" role="tablist" aria-label="Dentistas">
        {dentists.map((dentist) => {
          const color = dentistColor(dentist.name, DENTIST_COLUMN_COLORS);
          const selected = dentist.id === activeDentist.id;
          return (
            <button
              key={dentist.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`agenda-dentist-tab ${selected ? "selected" : ""}`}
              style={{ "--dentist-accent": color }}
              onClick={() => onSelectDentist?.(dentist.id)}
            >
              <span className="agenda-dentist-tab-avatar" style={{ background: color }}>
                {dentistInitials(dentist.name)}
              </span>
              <span className="agenda-dentist-tab-name">{dentist.name}</span>
            </button>
          );
        })}
      </div>

      <div className="agenda-board">
        <div className="agenda-time-col">
          <div className="agenda-col-header-spacer" />
          <div className="agenda-time-labels" style={{ height: boardHeight }}>
            {timeLabels.map(({ label, top }) => (
              <span
                key={label}
                className="agenda-time-label"
                style={{ top: `${top}px` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="agenda-dentists-scroll">
          <div className="agenda-dentist-col agenda-dentist-col-single">
            <div className="agenda-dentist-header">
              <div className="agenda-dentist-avatar" style={{ background: activeColor }}>
                {dentistInitials(activeDentist.name)}
              </div>
              <div>
                <strong>{activeDentist.name}</strong>
                <span>
                  {(activeDentist.specialties ?? []).slice(0, 2).join(" · ") ||
                    "Odontologia"}
                </span>
              </div>
            </div>

            <div
              className="agenda-dentist-grid"
              style={{ height: boardHeight }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const slotIndex = Math.floor(y / SLOT_HEIGHT_PX);
                const minutes = dayStart * 60 + slotIndex * SLOT_MINUTES;
                if (minutes >= dayEnd * 60) return;
                const isUnavailable = unavailableRanges.some(
                  (r) => minutes >= r.start && minutes < r.end,
                );
                if (isUnavailable) {
                  onBlockedSlotClick?.();
                  return;
                }
                onEmptySlotClick?.({
                  dentistId: activeDentist.id,
                  timeBegin: minutesToTimeLabel(minutes),
                });
              }}
            >
              {Array.from({ length: totalSlots }).map((_, i) => (
                <div key={i} className="agenda-grid-line" />
              ))}

              {unavailableRanges.map((r, i) => {
                const top = ((r.start - dayStart * 60) / SLOT_MINUTES) * SLOT_HEIGHT_PX;
                const height = ((r.end - r.start) / SLOT_MINUTES) * SLOT_HEIGHT_PX;
                return (
                  <div
                    key={i}
                    className="agenda-unavailable-block"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    {height >= 34 && (
                      <span className="agenda-unavailable-label">Fora do expediente</span>
                    )}
                  </div>
                );
              })}

              {columnAppointments.map((apt) => (
                <AppointmentBlock
                  key={apt.id}
                  appointment={apt}
                  patientName={patientMap[apt.patient_id]?.name}
                  color={activeColor}
                  selected={selectedAppointmentId === apt.id}
                  onSelect={onSelectAppointment}
                  dayStart={dayStart}
                />
              ))}
            </div>
          </div>
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
        <span className="agenda-legend-unavailable">
          <span className="agenda-legend-unavailable-swatch" />
          Fora do expediente
        </span>
        <span className="agenda-legend-hint">
          Horário: {formatTimeShort(`${dayStart}:00`)} – {dayEnd}:00 · clique em um horário vazio para agendar
        </span>
      </div>
    </div>
  );
}

export { ConfirmationBadge };