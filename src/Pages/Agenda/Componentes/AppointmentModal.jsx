import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { API_URL, authHeaders } from "../../../utils/api";
import { toISODate } from "../utils";
import {formatPhone} from "../../../utils/masks";


const EMPTY_PROCEDURE = { procedure_id: "", tooth: "" };

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
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(false);

  const [procedureOptions, setProcedureOptions] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);

  const isEdit = Boolean(editAppointmentId);

  const totalDuration = form.procedures.reduce((sum, row) => {
    const proc = procedureOptions.find(
      (p) => String(p.id) === String(row.procedure_id),
    );
    return sum + (proc?.duration ?? 0);
  }, 0);

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
    if (!form.dentist_id || !form.appointment_date || totalDuration <= 0) {
      setAvailableTimes([]);
      return;
    }
    setTimesLoading(true);
    try {
      const params = new URLSearchParams({
        dentist_id: String(form.dentist_id),
        appointment_date: form.appointment_date,
        duration_minutes: String(totalDuration),
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
  }, [token, form.dentist_id, form.appointment_date, totalDuration]);

  useEffect(() => {
    if (!open) return;
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
        })
        .catch(() => {
          setForm({
            dentist_id: "",
            patient_id: "",
            appointment_date: toISODate(selectedDate),
            time_begin: "",
            notes: "",
            procedures: [{ ...EMPTY_PROCEDURE }],
          });
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
      });
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
    if (!form.time_begin) e.time_begin = "Selecione o horário";
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
                  min={toISODate(new Date())}
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

            <div className="form-group">
              <label className="form-label">
                Paciente<span className="req">*</span>
              </label>
              <input
                type="search"
                className="form-input"
                placeholder="Buscar por nome..."
                value={patientSearch}
                onChange={(ev) => setPatientSearch(ev.target.value)}
              />
              <select
                className={`form-select ${errors.patient_id ? "input-error" : ""}`}
                style={{ marginTop: 8 }}
                value={form.patient_id}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, patient_id: ev.target.value }))
                }
              >
                <option value="">
                  {patientsLoading ? "Buscando..." : "Selecione o paciente"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatPhone(p.phone)}
                  </option>
                ))}
              </select>
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
                  <input
                    className="form-input"
                    placeholder="Dente FDI"
                    maxLength={2}
                    value={row.tooth}
                    onChange={(ev) =>
                      setProcedure(index, "tooth", ev.target.value.replace(/\D/g, ""))
                    }
                  />
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
                disabled={!form.dentist_id || totalDuration <= 0}
              >
                <option value="">
                  {timesLoading
                    ? "Carregando horários..."
                    : availableTimes.length
                      ? "Selecione um horário disponível"
                      : "Nenhum horário livre (ajuste dentista, data ou procedimentos)"}
                </option>
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
