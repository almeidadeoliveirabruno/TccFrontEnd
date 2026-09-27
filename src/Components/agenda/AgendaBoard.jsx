import { useState, useRef, useEffect } from "react";
import { Search, X, MessageCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import "./AgendaBoard.css";

import {
  APPOINTMENT_STATUS,
  DENTIST_COLUMN_COLORS,
  getConfirmationUi,
  SLOT_HEIGHT_PX,
  SLOT_MINUTES,
} from "../../Pages/Agenda/constants";
import {
  dentistColor,
  dentistInitials,
  formatTimeShort,
  minutesToTimeLabel,
  timeToMinutes,
} from "../../Pages/Agenda/utils";

// Ícone SVG do WhatsApp inline
function WhatsAppIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L.054 23.454a.5.5 0 0 0 .609.61l5.7-1.49A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.686-.524-5.21-1.435l-.375-.222-3.882 1.016 1.03-3.78-.245-.39A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

function ConfirmationBadge({ appointment, compact }) {
  const ui = getConfirmationUi(appointment);
  const sent = Boolean(appointment?.confirmation_message_sent);
  const Icon =
    ui.key === "confirmed"
      ? CheckCircle2
      : ui.key === "canceled"
        ? XCircle
        : ui.key === "waiting"
          ? Clock
          : MessageCircle;

  if (compact) {
    // No bloco compacto: apenas ícone WhatsApp (sem texto)
    const waColor = sent ? "#25d366" : "#94a3b8";
    return (
      <span className="agenda-whatsapp-icon-wrap">
        <WhatsAppIcon size={18} color={waColor} />
      </span>
    );
  }

  // No painel de detalhes: badge completo com texto
  return (
    <span className={`agenda-confirm-badge tone-${ui.tone}`}>
      <Icon size={14} />
      <span>{ui.label}</span>
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
  dayEnd,
}) {
  const startMin = timeToMinutes(appointment.time_begin);
  const endMin = timeToMinutes(appointment.time_end);
  const gridStart = dayStart * 60;
  const gridEnd = (dayEnd ?? 24) * 60;
  const clampedStart = Math.max(startMin, gridStart);
  const clampedEnd = Math.min(endMin, gridEnd);
  const top = Math.max(0, ((clampedStart - gridStart) / SLOT_MINUTES) * SLOT_HEIGHT_PX);
  const height = Math.max(
    ((clampedEnd - clampedStart) / SLOT_MINUTES) * SLOT_HEIGHT_PX - 4,
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
        backgroundColor: statusStyle.cardBg || "rgba(255, 255, 255, 0.96)",
        borderColor: statusStyle.cardBorder || "rgba(148, 163, 184, 0.25)",
        borderLeftColor: statusStyle.accent,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(appointment);
      }}
    >
      <div className="agenda-appt-block-row">
        <div className="agenda-appt-block-main">
          <strong>{patientName ?? "Paciente"}</strong>
          <span>{procedures}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {Boolean(appointment.receivable || appointment.has_receivable) && (
            <span
              title={
                (appointment.receivable?.status ?? appointment.receivable_status) === "pago"
                  ? "Cobrança paga"
                  : (appointment.receivable?.status ?? appointment.receivable_status) === "cancelado"
                    ? "Cobrança cancelada"
                    : "Cobrança gerada (Pendente)"
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor:
                  (appointment.receivable?.status ?? appointment.receivable_status) === "pago"
                    ? "#DCFCE7"
                    : (appointment.receivable?.status ?? appointment.receivable_status) === "cancelado"
                      ? "#F3F4F6"
                      : "#FEF3C7",
                color:
                  (appointment.receivable?.status ?? appointment.receivable_status) === "pago"
                    ? "#16A34A"
                    : (appointment.receivable?.status ?? appointment.receivable_status) === "cancelado"
                      ? "#9CA3AF"
                      : "#D97706",
                fontSize: "11px",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              $
            </span>
          )}
          <ConfirmationBadge appointment={appointment} compact />
        </div>
      </div>
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

  const [dentistSearch, setDentistSearch] = useState("");
  const [dentistDropdownOpen, setDentistDropdownOpen] = useState(false);
  const dentistDropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (dentistDropdownRef.current && !dentistDropdownRef.current.contains(e.target)) {
        setDentistDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDentists = dentistSearch.trim()
    ? dentists.filter((d) =>
      d.name.toLowerCase().includes(dentistSearch.toLowerCase())
    )
    : dentists;

  return (
    <div className="agenda-board-wrap">
      <div className="agenda-dentist-selector" ref={dentistDropdownRef}>
        <div className="agenda-dentist-selected-card">
          <div className="agenda-dentist-selected-left">
            <div
              className="agenda-dentist-selected-avatar"
              style={{ background: activeColor }}
            >
              {dentistInitials(activeDentist.name)}
            </div>
            <div className="agenda-dentist-selected-info">
              <strong>{activeDentist.name}</strong>
              <span>
                {(activeDentist.specialties ?? []).slice(0, 2).join(" · ") ||
                  "Odontologia"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="agenda-dentist-change-btn"
            onClick={() => {
              setDentistSearch("");
              setDentistDropdownOpen((o) => !o);
            }}
          >
            Trocar
          </button>
        </div>

        {/* Dropdown de busca */}
        {dentistDropdownOpen && (
          <div className="agenda-dentist-dropdown">
            <div className="agenda-dentist-search-box">
              <Search size={15} className="agenda-dentist-search-icon" />
              <input
                type="text"
                className="agenda-dentist-search-input"
                placeholder="Buscar dentista por nome..."
                value={dentistSearch}
                autoFocus
                onChange={(e) => setDentistSearch(e.target.value)}
              />
              {dentistSearch && (
                <button
                  type="button"
                  className="agenda-dentist-clear-btn"
                  onClick={() => setDentistSearch("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="agenda-dentist-list">
              {filteredDentists.length === 0 ? (
                <div className="agenda-dentist-empty">
                  Nenhum dentista encontrado{dentistSearch ? ` para "${dentistSearch}"` : ""}.
                </div>
              ) : (
                filteredDentists.map((dentist) => {
                  const color = dentistColor(dentist.name, DENTIST_COLUMN_COLORS);
                  const isActive = dentist.id === activeDentist.id;
                  return (
                    <button
                      key={dentist.id}
                      type="button"
                      className={`agenda-dentist-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        onSelectDentist?.(dentist.id);
                        setDentistDropdownOpen(false);
                        setDentistSearch("");
                      }}
                    >
                      <div
                        className="agenda-dentist-item-avatar"
                        style={{ background: color }}
                      >
                        {dentistInitials(dentist.name)}
                      </div>
                      <div className="agenda-dentist-item-info">
                        <span className="agenda-dentist-item-name">{dentist.name}</span>
                        <span className="agenda-dentist-item-spec">
                          {(dentist.specialties ?? []).slice(0, 2).join(" · ") ||
                            "Odontologia"}
                        </span>
                      </div>
                      {isActive && (
                        <span className="agenda-dentist-item-check">✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
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
                <div
                  key={i}
                  className={`agenda-grid-line ${i % 2 === 1 ? "agenda-grid-line-hour" : "agenda-grid-line-half"}`}
                />
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
                  dayEnd={dayEnd}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="agenda-board-legend">
        <span className="agenda-legend-title">Status</span>
        {Object.entries({
          agendado: { label: "Agendado", accent: "#94a3b8" },
          confirmado: { label: "Confirmado", accent: "#FEF3C7" },

          realizado: { label: "Realizado", accent: "#22c55e" },
          faltou: { label: "Faltou", accent: "#ef4444" },
          cancelado: { label: "Cancelado", accent: "#ef4444" },
        }).map(([key, { label, accent }]) => (
          <span key={key} className="agenda-legend-status-item">
            <span className="agenda-legend-status-swatch" style={{ background: accent }} />
            {label}
          </span>
        ))}
        <span className="agenda-legend-separator" />
        <span className="agenda-legend-title">WhatsApp</span>
        <span className="agenda-legend-wa-item">
          <WhatsAppIcon size={15} color="#94a3b8" />
          <span>Não enviado</span>
        </span>
        <span className="agenda-legend-wa-item">
          <WhatsAppIcon size={15} color="#25d366" />
          <span>Enviado</span>
        </span>
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

export { ConfirmationBadge, WhatsAppIcon };