import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Search, X } from "lucide-react";
import "./AppointmentModal.css";
import { API_URL, authHeaders } from "../../Services/api";
import { toISODate } from "../../Pages/Agenda/utils";
import { formatPhone } from "../../utils/masks";
import OdontogramModal from "../patients/OdontogramModal";

const EMPTY_PROCEDURE = { procedure_id: "", tooth: "" };

function getPatientInitials(name) {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function AppointmentModal({
  open,
  onClose,
  onSaved,
  token,
  selectedDate,
  dentists,
  editAppointmentId,
  preset,
}) {
  const [form, setForm] = useState({
    dentist_id: "",
    patient_id: "",
    appointment_date: toISODate(selectedDate),
    time_begin: "",
    notes: "",
    procedures: [{ ...EMPTY_PROCEDURE }],
    generate_receivable: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  const [procedureOptions, setProcedureOptions] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);

  // Odontograma: armazena o índice da linha de procedimento aberta
  const [odoRowIndex, setOdoRowIndex] = useState(null);

  const isEdit = Boolean(editAppointmentId);

  const totalDuration = form.procedures.reduce((sum, row) => {
    const proc = procedureOptions.find(
      (p) => String(p.id) === String(row.procedure_id),
    );
    return sum + (proc?.duration ?? 0);
  }, 0);

  const effectiveDuration = totalDuration > 0 ? totalDuration : 30;

  // Fechar dropdown de pacientes ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(e.target)
      ) {
        setPatientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "30",
        ...(patientSearch && { search: patientSearch }),
      });
      const r = await fetch(`${API_URL}/patients?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setPatients(data.items ?? []);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, [token, patientSearch]);

  const loadProcedures = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: "1", page_size: "20" });
      const r = await fetch(`${API_URL}/procedures?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setProcedureOptions(data.items ?? []);
    } catch {
      setProcedureOptions([]);
    }
  }, [token]);

  const loadAvailableTimes = useCallback(async () => {
    if (!form.dentist_id || !form.appointment_date) {
      setAvailableTimes([]);
      return;
    }
    setTimesLoading(true);
    try {
      const params = new URLSearchParams({
        dentist_id: String(form.dentist_id),
        appointment_date: form.appointment_date,
        duration_minutes: String(effectiveDuration),
        ...(editAppointmentId && { exclude_appointment_id: String(editAppointmentId) }),
      });
      const r = await fetch(`${API_URL}/appointments/available-times?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setAvailableTimes(Array.isArray(data) ? data : []);
    } catch {
      setAvailableTimes([]);
    } finally {
      setTimesLoading(false);
    }
  }, [token, form.dentist_id, form.appointment_date, effectiveDuration, editAppointmentId]);

  useEffect(() => {
    if (!open) {
      setAvailableTimes([]);
      return;
    }
    loadProcedures();
  }, [open, loadProcedures]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(loadPatients, 250);
    return () => clearTimeout(t);
  }, [open, loadPatients, patientSearch]);

  useEffect(() => {
    if (!open) return;
    loadAvailableTimes();
  }, [open, loadAvailableTimes]);

  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (editAppointmentId) {
      setLoadingDetail(true);
      fetch(`${API_URL}/appointments/${editAppointmentId}`, {
        headers: authHeaders(token),
      })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((data) => {
          setForm({
            dentist_id: String(data.dentist_id),
            patient_id: String(data.patient_id),
            appointment_date: data.appointment_date,
            time_begin: data.time_begin?.slice(0, 5) ?? "",
            notes: data.notes ?? "",
            procedures: (data.procedures ?? []).length
              ? data.procedures.map((item) => ({
                  procedure_id: String(item.procedure?.id ?? ""),
                  tooth: item.tooth ?? "",
                }))
              : [{ ...EMPTY_PROCEDURE }],
          });

          if (data.patient_id) {
            fetch(`${API_URL}/patients/${data.patient_id}`, {
              headers: authHeaders(token),
            })
              .then((pr) => (pr.ok ? pr.json() : null))
              .then((patientData) => {
                if (patientData) setSelectedPatient(patientData);
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          setForm({
            dentist_id: "",
            patient_id: "",
            appointment_date: toISODate(selectedDate),
            time_begin: "",
            notes: "",
            procedures: [{ ...EMPTY_PROCEDURE }],
            generate_receivable: true,
          });
          setSelectedPatient(null);
        })
        .finally(() => setLoadingDetail(false));
    } else {
      setForm({
        dentist_id: preset?.dentistId ? String(preset.dentistId) : "",
        patient_id: "",
        appointment_date: toISODate(selectedDate),
        time_begin: preset?.timeBegin ?? "",
        notes: "",
        procedures: [{ ...EMPTY_PROCEDURE }],
        generate_receivable: true,
      });
      setSelectedPatient(null);
      setPatientSearch("");
    }
  }, [open, editAppointmentId, token, selectedDate, preset]);

  function setProcedure(index, field, value) {
    setForm((prev) => {
      const next = [...prev.procedures];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, procedures: next };
    });
  }

  function addProcedureRow() {
    setForm((prev) => ({
      ...prev,
      procedures: [...prev.procedures, { ...EMPTY_PROCEDURE }],
    }));
  }

  function removeProcedureRow(index) {
    setForm((prev) => ({
      ...prev,
      procedures: prev.procedures.filter((_, i) => i !== index),
    }));
  }

  function validate() {
    const e = {};
    if (!form.dentist_id) e.dentist_id = "Selecione o dentista";
    if (!form.patient_id) e.patient_id = "Selecione o paciente";
    if (!form.appointment_date) e.appointment_date = "Informe a data";
    if (!form.time_begin) {
      e.time_begin = "Selecione o horário";
    } else if (
      !isEdit &&
      availableTimes.length > 0 &&
      !timesLoading &&
      !availableTimes.includes(form.time_begin)
    ) {
      e.time_begin = "Horário indisponível (conflito com outra consulta ou fora do expediente)";
    }
    const validProcedures = form.procedures.filter((p) => p.procedure_id);
    if (!validProcedures.length) {
      e.procedures = "Informe ao menos um procedimento";
    }
    for (const row of validProcedures) {
      if (row.tooth && !/^\d{2}$/.test(row.tooth)) {
        e.procedures = "Dente inválido (use FDI, ex: 11, 36)";
        break;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        dentist_id: Number(form.dentist_id),
        patient_id: Number(form.patient_id),
        appointment_date: form.appointment_date,
        time_begin: `${form.time_begin}:00`,
        notes: form.notes.trim() || null,
        procedures: form.procedures
          .filter((p) => p.procedure_id)
          .map((p) => ({
            procedure_id: Number(p.procedure_id),
            tooth: p.tooth.trim() || null,
          })),
        generate_receivable: form.generate_receivable,
      };

      const url = isEdit
        ? `${API_URL}/appointments/${editAppointmentId}`
        : `${API_URL}/appointments`;
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        const msg =
          err.detail?.[0]?.msg ??
          (typeof err.detail === "string" ? err.detail : null) ??
          "Não foi possível salvar o agendamento.";
        setErrors({ form: msg });
        return;
      }

      onSaved?.();
      onClose();
    } catch {
      setErrors({ form: "Erro de conexão ao salvar." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`} onClick={onClose}>
      <div className="modal agenda-modal" onClick={(ev) => ev.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "Editar agendamento" : "Novo agendamento"}
          </h2>
          <button type="button" className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        {loadingDetail ? (
          <p>Carregando...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {errors.form ? (
              <p className="form-error agenda-form-error">{errors.form}</p>
            ) : null}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Dentista<span className="req">*</span>
                </label>
                <select
                  className={`form-select ${errors.dentist_id ? "input-error" : ""}`}
                  value={form.dentist_id}
                  onChange={(ev) =>
                    setForm((f) => ({
                      ...f,
                      dentist_id: ev.target.value,
                      time_begin: "",
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.dentist_id ? (
                  <span className="form-error">{errors.dentist_id}</span>
                ) : null}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Data<span className="req">*</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.appointment_date ? "input-error" : ""}`}
                  value={form.appointment_date}
                  min={isEdit ? undefined : toISODate(new Date())}
                  onChange={(ev) =>
                    setForm((f) => ({
                      ...f,
                      appointment_date: ev.target.value,
                      time_begin: "",
                    }))
                  }
                />
                {errors.appointment_date ? (
                  <span className="form-error">{errors.appointment_date}</span>
                ) : null}
              </div>
            </div>

            <div className="form-group" ref={patientDropdownRef}>
              <label className="form-label">
                Paciente<span className="req">*</span>
              </label>

              {selectedPatient ? (
                <div className="agenda-patient-selected-card">
                  <div className="agenda-patient-selected-left">
                    <div className="agenda-patient-avatar">
                      {getPatientInitials(selectedPatient.name)}
                    </div>
                    <div className="agenda-patient-info">
                      <strong className="agenda-patient-name">{selectedPatient.name}</strong>
                      <div className="agenda-patient-meta">
                        {selectedPatient.phone ? (
                          <span>📞 {formatPhone(selectedPatient.phone)}</span>
                        ) : (
                          <span>Sem telefone cadastrado</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="agenda-patient-change-btn"
                    onClick={() => {
                      setSelectedPatient(null);
                      setForm((f) => ({ ...f, patient_id: "" }));
                      setPatientSearch("");
                      setPatientDropdownOpen(true);
                    }}
                  >
                    Alterar
                  </button>
                </div>
              ) : (
                <div className="agenda-patient-picker">
                  <div className="agenda-patient-search-box">
                    <Search size={16} className="agenda-patient-search-icon" />
                    <input
                      type="text"
                      className={`agenda-patient-search-input ${errors.patient_id ? "input-error" : ""}`}
                      placeholder="Buscar paciente por nome..."
                      value={patientSearch}
                      onChange={(ev) => {
                        setPatientSearch(ev.target.value);
                        setPatientDropdownOpen(true);
                      }}
                      onFocus={() => setPatientDropdownOpen(true)}
                    />
                    {patientSearch && (
                      <button
                        type="button"
                        className="agenda-patient-clear-search-btn"
                        onClick={() => setPatientSearch("")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {patientDropdownOpen && (
                    <div className="agenda-patient-dropdown">
                      {patientsLoading ? (
                        <div className="agenda-patient-empty">Buscando pacientes...</div>
                      ) : patients.length === 0 ? (
                        <div className="agenda-patient-empty">
                          Nenhum paciente encontrado {patientSearch ? `para "${patientSearch}"` : ""}.
                        </div>
                      ) : (
                        patients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="agenda-patient-item"
                            onClick={() => {
                              setSelectedPatient(p);
                              setForm((f) => ({ ...f, patient_id: String(p.id) }));
                              setPatientDropdownOpen(false);
                              setPatientSearch("");
                              setErrors((err) => {
                                const next = { ...err };
                                delete next.patient_id;
                                return next;
                              });
                            }}
                          >
                            <div className="agenda-patient-avatar">
                              {getPatientInitials(p.name)}
                            </div>
                            <div className="agenda-patient-info">
                              <span className="agenda-patient-name">{p.name}</span>
                              <div className="agenda-patient-meta">
                                {p.phone ? (
                                  <span>{formatPhone(p.phone)}</span>
                                ) : (
                                  <span>Sem telefone</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {errors.patient_id ? (
                <span className="form-error">{errors.patient_id}</span>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label">
                Procedimentos<span className="req">*</span>
              </label>
              {form.procedures.map((row, index) => (
                <div key={index} className="agenda-procedure-row">
                  <select
                    className="form-select"
                    value={row.procedure_id}
                    onChange={(ev) =>
                      setProcedure(index, "procedure_id", ev.target.value)
                    }
                  >
                    <option value="">Procedimento</option>
                    {procedureOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.duration ?? 0} min)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    title="Selecionar dente no odontograma"
                    onClick={() => setOdoRowIndex(index)}
                    style={{
                      background: row.tooth ? "linear-gradient(135deg,#0cb0c7,#0ea5e9)" : "#f1f5f9",
                      border: "1.5px solid " + (row.tooth ? "#0cb0c7" : "#e2e8f0"),
                      borderRadius: 10,
                      minWidth: 64,
                      height: "100%",
                      alignSelf: "stretch",
                      fontSize: row.tooth ? 14 : 16,
                      fontWeight: row.tooth ? 700 : 400,
                      color: row.tooth ? "#fff" : "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      paddingInline: 10,
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                      fontFamily: "inherit",
                    }}
                  >
                    {row.tooth ? (
                      <>🦷 {row.tooth}</>
                    ) : (
                      <>🦷<span style={{ fontSize: 11, marginLeft: 2 }}>Dente</span></>
                    )}
                  </button>
                  {form.procedures.length > 1 ? (
                    <button
                      type="button"
                      className="btn-icon del"
                      onClick={() => removeProcedureRow(index)}
                      aria-label="Remover procedimento"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              ))}
              <button type="button" className="agenda-add-procedure" onClick={addProcedureRow}>
                <Plus size={16} />
                Adicionar procedimento
              </button>
              {totalDuration > 0 ? (
                <p className="agenda-duration-hint">Duração estimada: {totalDuration} min</p>
              ) : null}
              {errors.procedures ? (
                <span className="form-error">{errors.procedures}</span>
              ) : null}
            </div>

            {/* Odontograma – portal para sobrepor todos os modais */}
            {odoRowIndex !== null && createPortal(
              <OdontogramModal
                value={form.procedures[odoRowIndex]?.tooth ?? ""}
                onSelect={(fdi) => setProcedure(odoRowIndex, "tooth", fdi)}
                onClose={() => setOdoRowIndex(null)}
              />,
              document.body
            )}

            <div className="form-group">
              <label className="form-label">
                Horário<span className="req">*</span>
              </label>
              <select
                className={`form-select ${errors.time_begin ? "input-error" : ""}`}
                value={form.time_begin}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, time_begin: ev.target.value }))
                }
                disabled={!form.dentist_id || !form.appointment_date}
              >
                <option value="">
                  {timesLoading
                    ? "Carregando horários..."
                    : availableTimes.length || form.time_begin
                      ? "Selecione um horário disponível"
                      : "Nenhum horário livre (ajuste dentista, data ou procedimentos)"}
                </option>
                {form.time_begin && !availableTimes.includes(form.time_begin) ? (
                  <option value={form.time_begin} disabled={!timesLoading && availableTimes.length > 0}>
                    {form.time_begin} {timesLoading || !availableTimes.length ? "" : "(Indisponível / Conflito)"}
                  </option>
                ) : null}
                {availableTimes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.time_begin ? (
                <span className="form-error">{errors.time_begin}</span>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={(ev) => setForm((f) => ({ ...f, notes: ev.target.value }))}
                placeholder="Informações adicionais para a recepção"
              />
            </div>

            {!isEdit && (
              <div className="form-group" style={{ marginTop: "8px", marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={form.generate_receivable}
                    onChange={(ev) => setForm((f) => ({ ...f, generate_receivable: ev.target.checked }))}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#0a9db2", cursor: "pointer" }}
                  />
                  <div>
                    <span>Gerar cobrança financeira para esta consulta</span>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 400, marginTop: "2px" }}>
                      Desmarque caso este agendamento seja um retorno ou continuação de procedimento já cobrado.
                    </div>
                  </div>
                </label>
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Agendar consulta"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
