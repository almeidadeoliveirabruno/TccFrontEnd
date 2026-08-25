import { useState, useEffect } from "react";
import { API_URL, authHeaders } from "../../../utils/api";

function splitTimeDay(timeDay) {
  if (!timeDay) return { day: "-", hour: "" };
  const parts = timeDay.split(" ");
  if (parts.length < 2) return { day: timeDay, hour: "" };
  return { day: parts[0], hour: parts.slice(1).join(" ") };
}

export default function AppointmentQuickDetailModal({
  open,
  appointmentId,
  onClose,
  token,
}) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !appointmentId) return;
    setLoading(true);
    setError("");
    setDetail(null);
    fetch(`${API_URL}/appointments/appointments/${appointmentId}`, {
      headers: authHeaders(token),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setDetail)
      .catch(() => setError("Erro ao carregar detalhes da consulta."))
      .finally(() => setLoading(false));
  }, [open, appointmentId, token]);

  const { day, hour } = splitTimeDay(detail?.time_day);

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Detalhes da consulta</div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Carregando...</div>
        ) : error ? (
          <div className="table-loading">{error}</div>
        ) : detail ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paciente</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {detail.pacient_name}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dentista</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {detail.dentist_name}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {day}
                </div>
              </div>
              {hour && (
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <div className="form-input" style={{ background: "#F9FAFB" }}>
                    {hour}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Procedimentos</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(detail.procedures ?? []).map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#374151" }}>
                    {p.name ?? p}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Valor total</label>
              <div className="form-input" style={{ background: "#F9FAFB" }}>
                R${" "}
                {Number(detail.total_price).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </>
        ) : null}

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}