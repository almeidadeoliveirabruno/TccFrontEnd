import { useState, useEffect } from "react";
import { API_URL, authHeaders } from "../../../utils/api";
import { formatPhone } from "../../../utils/masks";

const AVATAR_PALETTE = ["#0CB0C7", "#818CF8", "#34D399", "#FB923C", "#F472B6", "#60A5FA"];

function avatarColor(name) {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function NewPatients({ token }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/home/last-patients`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        if (active) setPatients(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setPatients([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <span className="dash-card-title">Novos pacientes</span>
        <a className="dash-card-link" href="/pacientes">
          Ver pacientes
        </a>
      </div>

      {loading ? (
        <div className="table-loading">Carregando...</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum paciente cadastrado ainda</p>
        </div>
      ) : (
        <ul className="new-patients-list">
          {patients.map((p) => (
            <li key={p.id} className="new-patient-row">
              <div
                className="new-patient-avatar"
                style={{ background: avatarColor(p.name) }}
              >
                {initials(p.name)}
              </div>
              <div className="new-patient-info">
                <span className="new-patient-name">{p.name}</span>
                {p.phone && (
                  <span className="new-patient-phone">{formatPhone(p.phone)}</span>
                )}
              </div>
              <span className="new-patient-date">{formatDate(p.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
