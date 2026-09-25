import { useState } from "react";
import OdontogramModal from "./OdontogramModal";
import {
  avatarColor,
  initials,
  genderLabel,
  genderIcon,
  calculateAge,
  formatBirthDateDisplay,
} from "../constants";
import { formatCpf, formatPhone } from "../../../utils/masks";

function formatConsultDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

// Notação FDI: sempre 2 dígitos numéricos, quadrante 1-8 e posição 1-8
// (1-4 dentição permanente, 5-8 dentição decídua).
function isValidFdiTooth(value) {
  return /^[1-8][1-8]$/.test(value);
}

export default function PatientDetailsPanel({
  patient,
  summary,
  history,
  loading,
  loadingHistory,
  onLoadHistory,
  onUpdateProcedureTooth,
  onEdit,
  onDelete,
}) {
  const [tab, setTab] = useState("resumo");
  const [menuOpen, setMenuOpen] = useState(false);
  // { key, value, saving, error } do procedimento sendo editado no histórico
  const [editingProc, setEditingProc] = useState(null);
  // controla abertura do odontograma
  const [odontogramOpen, setOdontogramOpen] = useState(false);

  async function handleSaveTooth(procedureId, key) {
    const value = editingProc?.value ?? "";

    if (value !== "" && !isValidFdiTooth(value)) {
      setEditingProc((prev) => ({
        ...prev,
        error: "Dente inválido. Use notação FDI: 2 dígitos, ex. 11, 36.",
      }));
      return;
    }

    setEditingProc((prev) => ({ ...prev, saving: true, error: null }));
    const ok = await onUpdateProcedureTooth(procedureId, value === "" ? null : value);
    if (ok) {
      setEditingProc(null);
    } else {
      setEditingProc((prev) => (prev && prev.key === key ? { ...prev, saving: false } : prev));
    }
  }

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

  const age = calculateAge(patient.birth_date);
  const lastConsult = summary?.last_consult;
  const nextConsult = summary?.next_consult;

  return (
    <>
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
                {formatPhone(patient.phone)}
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
          onClick={() => {
            setTab("historico");
            onLoadHistory();
          }}
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
                {lastConsult ? (
                  <>
                    <div className="patient-info-value">
                      {formatConsultDate(lastConsult.date)}
                    </div>
                    <div className="patient-info-sub">{lastConsult.dentist}</div>
                  </>
                ) : (
                  <div className="patient-info-value">Nenhuma consulta realizada</div>
                )}
              </div>
            </div>

            <div className="patient-info-card">
              <div className="patient-info-icon patient-info-icon-alt">
                <i className="ti ti-calendar-plus" aria-hidden="true" />
              </div>
              <div>
                <div className="patient-info-label">Próxima consulta</div>
                {nextConsult ? (
                  <>
                    <div className="patient-info-value">
                      {formatConsultDate(nextConsult.date)} · {nextConsult.time_begin}
                    </div>
                    <div className="patient-info-sub">{nextConsult.dentist}</div>
                  </>
                ) : (
                  <div className="patient-info-value">Nenhuma consulta agendada</div>
                )}
              </div>
            </div>
          </div>

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
          {loadingHistory ? (
            <div className="table-loading">Carregando histórico...</div>
          ) : !history || history.length === 0 ? (
            <p className="patient-mock-note">Nenhum histórico encontrado.</p>
          ) : (
            <ul className="patient-history-list">
              {history.map((item) => (
                <li key={item.appointment_id} className="patient-history-item">
                  <span className="patient-history-dot" />
                  <div>
                    <div className="patient-history-date">
                      {formatConsultDate(item.date)} · {item.time_begin}
                    </div>
                    <div className="patient-history-dentist">{item.dentist}</div>
                    {item.procedures?.length > 0 && (
                      <ul className="patient-history-procedures">
                        {item.procedures.map((proc) => {
                          const key = `${item.appointment_id}-${proc.id}`;
                          const isEditing = editingProc?.key === key;

                          return (
                            <li key={proc.id} className="patient-procedure-item">
                              {isEditing ? (
                                <span className="patient-procedure-edit">
                                  <span>{proc.name}</span>
                                  {/* Botão para abrir o odontograma */}
                                  <button
                                    type="button"
                                    className="patient-procedure-tooth-picker"
                                    title="Selecionar dente no odontograma"
                                    disabled={editingProc.saving}
                                    onClick={() => setOdontogramOpen(true)}
                                  >
                                    🦷 {editingProc.value ? `Dente ${editingProc.value}` : "Selecionar dente"}
                                    <i className="ti ti-chevron-down" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-sm"
                                    title="Salvar"
                                    disabled={editingProc.saving}
                                    onClick={() => handleSaveTooth(proc.id, key)}
                                  >
                                    <i className="ti ti-check" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-icon-sm"
                                    title="Cancelar"
                                    disabled={editingProc.saving}
                                    onClick={() => setEditingProc(null)}
                                  >
                                    <i className="ti ti-x" aria-hidden="true" />
                                  </button>
                                  {editingProc.error && (
                                    <span className="patient-procedure-error">{editingProc.error}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="patient-procedure-display">
                                  {proc.display}
                                  <button
                                    type="button"
                                    className="btn-icon-sm patient-procedure-edit-btn"
                                    title="Editar dente (FDI)"
                                    onClick={() =>
                                      setEditingProc({
                                        key,
                                        value: proc.tooth ?? "",
                                        saving: false,
                                        error: null,
                                      })
                                    }
                                  >
                                    <i className="ti ti-pencil" aria-hidden="true" />
                                  </button>
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>

      {/* Odontograma modal */}
      {odontogramOpen && (
        <OdontogramModal
          value={editingProc?.value ?? ""}
          onSelect={(fdi) =>
            setEditingProc((prev) => prev ? { ...prev, value: fdi, error: null } : prev)
          }
          onClose={() => setOdontogramOpen(false)}
        />
      )}
    </>
  );
}