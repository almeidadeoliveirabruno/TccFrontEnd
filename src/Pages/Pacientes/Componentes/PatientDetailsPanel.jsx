import { useState } from "react";
import {
  avatarColor,
  initials,
  genderLabel,
  genderIcon,
  calculateAge,
  formatBirthDateDisplay,
  getMockPatientTimeline,
} from "../constants";
import { formatCpf } from "../../../utils/masks";

export default function PatientDetailsPanel({ patient, loading, onEdit, onDelete }) {
  const [tab, setTab] = useState("resumo");
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="patient-detail-panel">
        <div className="table-loading">Carregando paciente...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-detail-panel">
        <div className="patient-detail-placeholder">
          <div className="empty-icon">🦷</div>
          <p>Selecione um paciente para ver os detalhes</p>
        </div>
      </div>
    );
  }

  const timeline = getMockPatientTimeline(patient.id);
  const age = calculateAge(patient.birth_date);

  return (
    <div className="patient-detail-panel">
      <div className="patient-detail-header">
        <div className="patient-detail-identity">
          <div
            className="patient-avatar patient-avatar-lg"
            style={{ background: avatarColor(patient.name) }}
          >
            {initials(patient.name)}
          </div>
          <div>
            <div className="patient-name patient-name-lg">{patient.name}</div>

            <div className="patient-meta-row">
              <span className="patient-meta-item">
                <i className={`ti ${genderIcon(patient.gender)}`} aria-hidden="true" />
                {genderLabel(patient.gender)}
              </span>
              <span className="patient-meta-item">
                <i className="ti ti-calendar" aria-hidden="true" />
                {age !== null ? `${age} anos` : "—"} (
                {formatBirthDateDisplay(patient.birth_date)})
              </span>
              <span className="patient-meta-item">
                <i className="ti ti-phone" aria-hidden="true" />
                {patient.phone}
              </span>
            </div>

            <div className="patient-meta-row patient-meta-row-sub">
              <span className="patient-meta-item">
                CPF: {formatCpf(patient.cpf ?? "")}
              </span>
              <span className="patient-meta-item">E-mail: {patient.email}</span>
              {patient.health_plan && (
                <span className="patient-meta-item">
                  Convênio: {patient.health_plan}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="patient-detail-actions">
          <button className="btn-cancel" onClick={() => onEdit(patient)}>
            <i className="ti ti-pencil" aria-hidden="true" /> Editar cadastro
          </button>
          <div className="patient-menu-wrap">
            <button
              className="btn-icon"
              onClick={() => setMenuOpen((v) => !v)}
              title="Mais opções"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="patient-menu-dropdown">
                <button
                  className="patient-menu-item del"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(patient.id);
                  }}
                >
                  🗑️ Excluir paciente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="patient-tabs">
        <button
          className={`patient-tab-btn ${tab === "resumo" ? "active" : ""}`}
          onClick={() => setTab("resumo")}
        >
          Resumo
        </button>
        <button
          className={`patient-tab-btn ${tab === "historico" ? "active" : ""}`}
          onClick={() => setTab("historico")}
        >
          Histórico
        </button>
      </div>

      {tab === "resumo" ? (
        <>
          <div className="patient-summary-cards">
            <div className="patient-info-card">
              <div className="patient-info-icon">
                <i className="ti ti-calendar-event" aria-hidden="true" />
              </div>
              <div>
                <div className="patient-info-label">Última consulta</div>
                <div className="patient-info-value">{timeline.lastConsult.date}</div>
                <div className="patient-info-sub">{timeline.lastConsult.title}</div>
              </div>
            </div>

            <div className="patient-info-card">
              <div className="patient-info-icon patient-info-icon-alt">
                <i className="ti ti-calendar-plus" aria-hidden="true" />
              </div>
              <div>
                <div className="patient-info-label">Próxima consulta</div>
                <div className="patient-info-value">
                  {timeline.nextConsult.date} · {timeline.nextConsult.time}
                </div>
                <div className="patient-info-sub">{timeline.nextConsult.dentist}</div>
              </div>
            </div>
          </div>
          <p className="patient-mock-note">
            Dados de consulta ilustrativos — em breve integrados à agenda.
          </p>

          <div className="patient-anamnesis-card">
            <div className="patient-anamnesis-label">
              <i className="ti ti-stethoscope" aria-hidden="true" />
              Observações / Anamnese
            </div>
            <div className="patient-anamnesis-value">
              {patient.observations?.trim()
                ? patient.observations
                : "Nenhuma observação registrada para este paciente."}
            </div>
          </div>
        </>
      ) : (
        <div className="patient-history-card">
          <ul className="patient-history-list">
            {timeline.history.map((item) => (
              <li key={item.id} className="patient-history-item">
                <span className="patient-history-dot" />
                <div>
                  <div className="patient-history-date">
                    {item.date} · {item.title}
                  </div>
                  <div className="patient-history-dentist">{item.dentist}</div>
                </div>
              </li>
            ))}
          </ul>
          <p className="patient-mock-note">
            Histórico ilustrativo — em breve integrado ao prontuário.
          </p>
        </div>
      )}
    </div>
  );
}