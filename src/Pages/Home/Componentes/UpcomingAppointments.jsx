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

function formatTime(value) {
  if (!value) return "";
  return value.slice(0, 5); // "08:00:00" -> "08:00"
}

function firstName(name) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}

export default function UpcomingAppointments({ token }) {
  const [dentists, setDentists] = useState([]);
  const [dentistId, setDentistId] = useState("");
  const [dentistName, setDentistName] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Busca os dentistas para preencher o seletor
  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/dentists/basic`, {
      headers: authHeaders(token),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        const list = data ?? [];
        setDentists(list);
        if (list.length > 0) {
          setDentistId(String(list[0].id));
        }
      })
      .catch(() => {
        if (active) setDentists([]);
      })
      .finally(() => {
        if (active) setLoadingDentists(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Busca as consultas quando um dentista é selecionado
  useEffect(() => {
    if (!dentistId) {
      setAppointments([]);
      setDentistName("");
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError(false);

    fetch(
      `${API_URL}/home/next-appointment-by-dentist?dentist_id=${dentistId}`,
      {
        headers: authHeaders(token),
      }
    )
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
          Próximos atendimentos
          {dentistName ? ` · ${firstName(dentistName)}` : ""}
        </span>

        <a className="dash-card-link" href="/agenda">
          Ver agenda
        </a>
      </div>

      <div className="upcoming-filter">
        <select
          value={dentistId}
          onChange={(e) => setDentistId(e.target.value)}
          disabled={loadingDentists}
        >
          <option value="">
            {loadingDentists
              ? "Carregando dentistas..."
              : "Selecione um dentista"}
          </option>

          {dentists.map((dentist) => (
            <option key={dentist.id} value={dentist.id}>
              {firstName(dentist.name)}
            </option>
          ))}
        </select>
      </div>

      {!dentistId ? (
        <div className="empty-state">
          <p>Selecione um dentista para ver os próximos atendimentos</p>
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
            const style =
              STATUS_STYLE[a.appointment_status] ??
              STATUS_STYLE.AGENDADO;

            return (
              <li key={i} className="agenda-row">
                <span className="agenda-time">{formatTime(a.time_begin)}</span>

                <div className="agenda-info">
                  <span className="agenda-patient">
                    {a.patient_name}
                  </span>

                  <span className="agenda-procedure">
                    {a.procedure_name?.join(", ") || "—"}
                  </span>
                </div>

                <span
                  className="badge"
                  style={{
                    background: style.bg,
                    color: style.color,
                  }}
                >
                  {STATUS_LABEL[a.appointment_status] ??
                    a.appointment_status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}