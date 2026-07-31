import { useState, useEffect } from "react";
import { STATUS_OPTIONS, STATUS_VALUE, EMPTY_FORM } from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";

// Listas de pacientes/dentistas para os selects (endpoints confirmados).
// Ambos retornam PaginatedResponse -> { items, page, page_size, total, total_pages }
// ⚠️ assumindo que PatientResponseCard e DentistResponse expõem um campo
// "name" — não tenho esses schemas. Se for outro nome (ex: full_name),
// troque nos dois <option> abaixo.
const PATIENTS_URL = `${API_URL}/patients?page=1&page_size=200`;
const DENTISTS_URL = `${API_URL}/dentists?page=1&page_size=200`;

function toothPattern(v) {
  return /^\d{2}$/.test(v);
}

export default function AtendimentoModal({
  open,
  editId,
  onClose,
  onSaved,
  token,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [procedureOptions, setProcedureOptions] = useState([]);

  const isEdit = !!editId;

  // carrega listas auxiliares (pacientes, dentistas, procedimentos) ao abrir
  useEffect(() => {
    if (!open) return;

    // silencioso: se alguma lista falhar, os campos viram inputs manuais (ID)
    fetch(PATIENTS_URL, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setPatients(d.items ?? []))
      .catch(() => setPatients([]));

    fetch(DENTISTS_URL, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setDentists(d.items ?? []))
      .catch(() => setDentists([]));

    fetch(`${API_URL}/procedures?page=1&page_size=200`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setProcedureOptions(d.items ?? []))
      .catch(() => setProcedureOptions([]));
  }, [open, token]);

  // carrega o atendimento (AppointmentResponse) quando é edição
  useEffect(() => {
    if (!open) return;

    if (!editId) {
      setForm(EMPTY_FORM);
      setErrors({});
      return;
    }

    setLoadingDetail(true);
    fetch(`${API_URL}/appointments/${editId}`, { headers: authHeaders(token) })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((a) => {
        setForm({
          dentist_id: String(a.dentist_id),
          patient_id: String(a.patient_id),
          appointment_date: a.appointment_date,
          time_begin: a.time_begin?.slice(0, 5) ?? "",
          time_end: a.time_end?.slice(0, 5) ?? "",
          notes: a.notes ?? "",
          procedures: (a.procedures ?? []).map((p) => ({
            procedure_id: p.procedure.id,
            tooth: p.tooth ?? "",
            _name: p.procedure.name,
            _price: p.procedure.price,
          })),
        });
        setErrors({});
      })
      .catch(() => onSaved(null))
      .finally(() => setLoadingDetail(false));
  }, [open, editId, token]);

  function validate() {
    const e = {};
    if (!form.dentist_id) e.dentist_id = "Selecione o dentista";
    if (!form.patient_id) e.patient_id = "Selecione o paciente";
    if (!form.appointment_date) e.appointment_date = "Campo obrigatório";
    if (!form.time_begin) e.time_begin = "Campo obrigatório";
    if (form.procedures.length === 0) e.procedures = "Adicione ao menos um procedimento";
    for (const p of form.procedures) {
      if (p.tooth && !toothPattern(p.tooth)) {
        e.procedures = "Dente deve estar no padrão FDI (ex: 11, 36)";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    const proceduresBody = form.procedures.map((p) => ({
      procedure_id: p.procedure_id,
      tooth: p.tooth || null,
    }));

    try {
      let r;
      if (isEdit) {
        const body = {
          appointment_date: form.appointment_date,
          time_begin: form.time_begin,
          time_end: form.time_end || null,
          procedures: proceduresBody,
          notes: form.notes.trim() || null,
        };
        r = await fetch(`${API_URL}/appointments/${editId}`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      } else {
        const body = {
          dentist_id: Number(form.dentist_id),
          patient_id: Number(form.patient_id),
          procedures: proceduresBody,
          appointment_date: form.appointment_date,
          time_begin: form.time_begin,
          time_end: form.time_end || null,
          notes: form.notes.trim() || null,
        };
        r = await fetch(`${API_URL}/appointments`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      }
      if (r.status === 409) {
        setErrors({ time_begin: "Horário indisponível para esse dentista" });
        return;
      }
      if (!r.ok) throw new Error();
      onSaved(isEdit ? "Atendimento atualizado!" : "Atendimento criado!");
    } catch {
      onSaved(null);
    } finally {
      setLoading(false);
    }
  }

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
    };
  }

  function toggleProcedure(proc) {
    setForm((f) => {
      const exists = f.procedures.some((p) => p.procedure_id === proc.id);
      return {
        ...f,
        procedures: exists
          ? f.procedures.filter((p) => p.procedure_id !== proc.id)
          : [
              ...f.procedures,
              { procedure_id: proc.id, tooth: "", _name: proc.name, _price: proc.price },
            ],
      };
    });
    setErrors((err) => ({ ...err, procedures: undefined }));
  }

  function setTooth(procedureId, value) {
    setForm((f) => ({
      ...f,
      procedures: f.procedures.map((p) =>
        p.procedure_id === procedureId ? { ...p, tooth: value } : p,
      ),
    }));
  }

  const selectedTotal = form.procedures.reduce((sum, p) => sum + Number(p._price || 0), 0);

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {isEdit ? "Editar atendimento" : "Novo atendimento"}
          </div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loadingDetail ? (
          <div className="table-loading">Carregando atendimento...</div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Dentista <span className="req">*</span>
                </label>
                {dentists.length > 0 ? (
                  <select
                    className={`form-input ${errors.dentist_id ? "input-error" : ""}`}
                    value={form.dentist_id}
                    onChange={set("dentist_id")}
                    disabled={isEdit}
                  >
                    <option value="">Selecione</option>
                    {dentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`form-input ${errors.dentist_id ? "input-error" : ""}`}
                    value={form.dentist_id}
                    onChange={set("dentist_id")}
                    placeholder="ID do dentista"
                    disabled={isEdit}
                  />
                )}
                {errors.dentist_id && <span className="form-error">{errors.dentist_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Paciente <span className="req">*</span>
                </label>
                {patients.length > 0 ? (
                  <select
                    className={`form-input ${errors.patient_id ? "input-error" : ""}`}
                    value={form.patient_id}
                    onChange={set("patient_id")}
                    disabled={isEdit}
                  >
                    <option value="">Selecione</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`form-input ${errors.patient_id ? "input-error" : ""}`}
                    value={form.patient_id}
                    onChange={set("patient_id")}
                    placeholder="ID do paciente"
                    disabled={isEdit}
                  />
                )}
                {errors.patient_id && <span className="form-error">{errors.patient_id}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Data <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.appointment_date ? "input-error" : ""}`}
                  type="date"
                  value={form.appointment_date}
                  onChange={set("appointment_date")}
                />
                {errors.appointment_date && (
                  <span className="form-error">{errors.appointment_date}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Início <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.time_begin ? "input-error" : ""}`}
                  type="time"
                  value={form.time_begin}
                  onChange={set("time_begin")}
                />
                {errors.time_begin && <span className="form-error">{errors.time_begin}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Término</label>
                <input
                  className="form-input"
                  type="time"
                  value={form.time_end}
                  onChange={set("time_end")}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Procedimentos <span className="req">*</span>
              </label>
              <div className={`cat-grid ${errors.procedures ? "cat-error" : ""}`}>
                {procedureOptions.map((proc) => {
                  const selected = form.procedures.find((p) => p.procedure_id === proc.id);
                  return (
                    <button
                      key={proc.id}
                      type="button"
                      className={`cat-chip ${selected ? "selected" : ""}`}
                      onClick={() => toggleProcedure(proc)}
                    >
                      {proc.name}
                    </button>
                  );
                })}
              </div>
              {errors.procedures && <span className="form-error">{errors.procedures}</span>}

              {form.procedures.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.procedures.map((p) => (
                    <div key={p.procedure_id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{p._name}</span>
                      <input
                        className="form-input"
                        style={{ width: 90 }}
                        placeholder="Dente (ex: 36)"
                        maxLength={2}
                        value={p.tooth}
                        onChange={(e) => setTooth(p.procedure_id, e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="proc-sub" style={{ fontSize: 13, color: "#6B7280" }}>
                    Total estimado: R${" "}
                    {selectedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={set("notes")}
                placeholder="Observações opcionais"
              />
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading || loadingDetail}
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
