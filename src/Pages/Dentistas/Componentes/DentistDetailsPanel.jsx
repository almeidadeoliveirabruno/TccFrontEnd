import "../Dentistas.css";
import { SPECIALTY_COLORS, STATUS_COLORS, statusLabel } from "../constants";
import DentistSchedules from "./DentistSchedules";

const AVATAR_PALETTE = [
  "#0CB0C7",
  "#818CF8",
  "#34D399",
  "#FB923C",
  "#F472B6",
  "#60A5FA",
];

function avatarColor(name) {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function DentistDetailsPanel({ dentist, token }) {
  if (!dentist) {
    return (
      <div className="dentist-details-placeholder">
        Clique em um dentista para ver seus detalhes aqui.
      </div>
    );
  }

  return (
    <>
      <div className="dentist-details-header">
        <div className="dentist-cell">
          <div
            className="dentist-avatar"
            style={{ background: avatarColor(dentist.name) }}
          >
            {initials(dentist.name)}
          </div>
          <div>
            <div className="dentist-name">{dentist.name}</div>
            <div className="dentist-email-sub">{dentist.email}</div>
          </div>
        </div>
        <span
          className="badge"
          style={{
            background:
              STATUS_COLORS[dentist.status]?.bg ?? STATUS_COLORS.ativo.bg,
            color:
              STATUS_COLORS[dentist.status]?.color ?? STATUS_COLORS.ativo.color,
          }}
        >
          {statusLabel(dentist.status)}
        </span>
      </div>

      <div className="dentist-detail-card">
        <div className="dentist-detail-label">Contato</div>
        <div className="dentist-detail-value">{dentist.phone}</div>
        <div className="dentist-detail-value">{dentist.email}</div>
      </div>

      <div className="dentist-detail-card">
        <div className="dentist-detail-label">Endereço</div>
        <div className="dentist-detail-value">
          {dentist.street || dentist.address?.street || "—"},{" "}
          {dentist.number || dentist.address?.number || "—"}
        </div>
        <div className="dentist-detail-value">
          {dentist.neighborhood || dentist.address?.neighborhood || "—"} ·{" "}
          {dentist.city || dentist.address?.city || "—"}/
          {dentist.state || dentist.address?.state || "—"}
        </div>
      </div>

      <div className="dentist-detail-card">
        <div className="dentist-detail-label">Especialidades</div>
        <div className="spec-cell-multi">
          {dentist.specialties?.length
            ? dentist.specialties.map((spec) => {
                const specStyle = SPECIALTY_COLORS[spec] ?? { dot: "#9CA3AF" };
                return (
                  <span key={spec} className="spec-cell">
                    <span
                      className="spec-dot"
                      style={{ background: specStyle.dot }}
                    />
                    {spec}
                  </span>
                );
              })
            : "—"}
        </div>
      </div>

      <div className="dentist-detail-card">
        <div className="dentist-detail-label">Horários de atendimento</div>
        <DentistSchedules dentistId={dentist.id} token={token} readOnly />
      </div>
    </>
  );
}
