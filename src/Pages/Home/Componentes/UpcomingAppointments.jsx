import { useState, useEffect } from "react";
import { API_URL, authHeaders } from "../../../utils/api";

const STATUS_LABEL = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
};

const STATUS_STYLE = {
  AGENDADO: { bg: "#FEF3C7", color: "#B45309" },
  CONFIRMADO: { bg: "#DCFCE7", color: "#15803D" },
};

export default function UpcomingAppointments({ token, dentistId }) {
  const [dentistName, setDentistName] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!dentistId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);

    fetch(`${API_URL}/home/next-appointment-by-dentist?dentist_id=${dentistId}`, {
      headers: authHeaders(token),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        setDentistName(data.dentist_name ?? "");
        setAppointments(data.appointments ?? []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, dentistId]);

  return (
    <div className="dash-card upcoming-card">
      <div className="dash-card-header">
        <span className="dash-card-title">
          Próximos atendimentos{dentistName ? ` · ${dentistName}` : ""}
        </span>
        <a className="dash-card-link" href="/agenda">
          Ver agenda
        </a>
      </div>

      {!dentistId ? (
        <div className="empty-state">
          <p>Selecione um dentista para ver a agenda</p>
        </div>
      ) : loading ? (
        <div className="table-loading">Carregando agenda...</div>
      ) : error ? (
        <div className="empty-state">
          <p>Não foi possível carregar a agenda</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>Nenhum atendimento agendado</p>
        </div>
      ) : (
        <ul className="agenda-list">
          {appointments.map((a, i) => {
            const style = STATUS_STYLE[a.appointment_status] ?? STATUS_STYLE.AGENDADO;
            return (
              <li key={i} className="agenda-row">
                <span className="agenda-time">{a.time_begin}</span>
                <div className="agenda-info">
                  <span className="agenda-patient">{a.patient_name}</span>
                  <span className="agenda-procedure">
                    {a.procedure_name?.join(", ") || "—"}
                  </span>
                </div>
                <span
                  className="badge"
                  style={{ background: style.bg, color: style.color }}
                >
                  {STATUS_LABEL[a.appointment_status] ?? a.appointment_status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
