import { useState, useEffect } from "react";
import "../Dentistas.css";
import { API_URL, authHeaders } from "../../../utils/api";
import { formatCpf } from "../../../utils/masks";
import { SPECIALTY_COLORS, STATUS_COLORS, statusLabel } from "../constants";
import DentistSchedules from "./DentistSchedules";
import {formatPhone } from "../../../utils/masks";

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

export default function DentistDetailsModal({ open, dentist, onClose, token }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !dentist) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/dentists/${dentist.id}`, { headers: authHeaders(token) })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, dentist, token]);

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div
        className="modal dentist-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">Detalhes do dentista</div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading || !detail ? (
          <div className="table-loading">Carregando detalhes...</div>
        ) : (
          <>
            <div className="dentist-details-header">
              <div className="dentist-cell">
                <div
                  className="dentist-avatar dentist-avatar-lg"
                  style={{ background: avatarColor(detail.name) }}
                >
                  {initials(detail.name)}
                </div>
                <div>
                  <div className="dentist-name dentist-name-lg">
                    {detail.name}
                  </div>
                  <div className="dentist-email-sub">CRO {detail.cro}</div>
                </div>
              </div>
              <span
                className="badge"
                style={{
                  background:
                    STATUS_COLORS[detail.status]?.bg ?? STATUS_COLORS.ativo.bg,
                  color:
                    STATUS_COLORS[detail.status]?.color ??
                    STATUS_COLORS.ativo.color,
                }}
              >
                {statusLabel(detail.status)}
              </span>
            </div>

            <div className="dentist-detail-grid">
              <div className="dentist-detail-card">
                <div className="dentist-detail-label">
                  <i className="ti ti-phone" aria-hidden="true" /> Contato
                </div>
                <div className="dentist-detail-value">{formatPhone(detail.phone)}</div>
                <div className="dentist-detail-value">{detail.email}</div>
              </div>

              <div className="dentist-detail-card">
                <div className="dentist-detail-label">
                  <i className="ti ti-id" aria-hidden="true" /> CPF
                </div>
                <div className="dentist-detail-value">
                  {detail.cpf
                    ? formatCpf(detail.cpf)
                    : detail.cpf_masked || "—"}
                </div>
              </div>

              <div className="dentist-detail-card">
                <div className="dentist-detail-label">
                  <i className="ti ti-map-pin" aria-hidden="true" /> Endereço
                </div>
                <div className="dentist-detail-value">
                  {detail.street}, {detail.number}
                  {detail.complement ? ` — ${detail.complement}` : ""}
                </div>
                <div className="dentist-detail-value">
                  {detail.neighborhood} · {detail.city}/{detail.state}
                </div>
                <div className="dentist-detail-value">CEP {detail.cep}</div>
              </div>

              <div className="dentist-detail-card">
                <div className="dentist-detail-label">
                  <i className="ti ti-star" aria-hidden="true" /> Especialidades
                </div>
                <div className="spec-cell-multi">
                  {detail.specialties?.length
                    ? detail.specialties.map((spec) => {
                        const specStyle = SPECIALTY_COLORS[spec] ?? {
                          dot: "#9CA3AF",
                        };
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
            </div>

            <div className="dentist-detail-card dentist-detail-card-full">
              <div className="dentist-detail-label">
                <i className="ti ti-calendar-time" aria-hidden="true" />{" "}
                Horários de atendimento
              </div>
              <DentistSchedules dentistId={detail.id} token={token} readOnly />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
