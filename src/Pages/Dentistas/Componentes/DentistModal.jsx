import { useState, useEffect } from "react";
import {
  SPECIALTIES,
  STATUS_OPTIONS,
  EMPTY_FORM,
  DAYS_OF_WEEK,
  EMPTY_SCHEDULE,
} from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";
import { validarCPF, validarTelefone } from "../../../utils/validators";
import {
  cleanDigits,
  formatCep,
  formatCpf,
  formatPhone,
} from "../../../utils/masks";
import DentistSchedules from "./DentistSchedules";

export default function DentistModal({
  open,
  editDentist,
  onClose,
  onSaved,
  token,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepLookupError, setCepLookupError] = useState("");
  const [scheduleDraft, setScheduleDraft] = useState([]); // só usado na criação
  const [newScheduleItem, setNewScheduleItem] = useState(EMPTY_SCHEDULE);
  const [usedSpecialties, setUsedSpecialties] = useState([]);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState("");

  // Sugestões = lista fixa + as já usadas na clínica, sem repetir
  const specialtySuggestions = Array.from(
    new Set([...SPECIALTIES, ...usedSpecialties]),
  ).sort();

  useEffect(() => {
    if (!open) return;
    fetch(`${API_URL}/dentists/specialties`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => setUsedSpecialties(Array.isArray(data) ? data : []))
      .catch(() => setUsedSpecialties([]));
  }, [open, token]);

  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (editDentist) {
      setLoadingDetail(true);
      fetch(`${API_URL}/dentists/${editDentist.id}`, {
        headers: authHeaders(token),
      })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((data) => {
          setForm({
            name: data.name,
            email: data.email,
            phone: formatPhone(data.phone ?? ""),
            cpf: formatCpf(data.cpf || ""),
            cro: data.cro,
            specialties: data.specialties ?? [],
            status: data.status,
            street: data.street,
            number: data.number,
            complement: data.complement ?? "",
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            cep: formatCep(data.cep ?? ""),
          });
        })
        .catch(() => setForm(EMPTY_FORM))
        .finally(() => setLoadingDetail(false));
    } else {
      setForm(EMPTY_FORM);
      setScheduleDraft([]);
      setNewScheduleItem(EMPTY_SCHEDULE);
    }
  }, [open, editDentist, token]);

  function validate() {
    const e = {};
    const cleanPhone = cleanDigits(form.phone);
    const cleanCpf = cleanDigits(form.cpf);

    if (!form.name.trim()) e.name = "Campo obrigatório";

    if (!form.email.trim()) {
      e.email = "Campo obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "E-mail inválido";
    }

    if (!cleanPhone) {
      e.phone = "Campo obrigatório";
    } else if (!validarTelefone(cleanPhone)) {
      e.phone = "Telefone inválido";
    }

    if (!cleanCpf) {
      e.cpf = "Campo obrigatório";
    } else if (!validarCPF(cleanCpf)) {
      e.cpf = "CPF inválido";
    }

    if (!form.cro.trim()) e.cro = "Campo obrigatório";
    if (form.specialties.length === 0)
      e.specialties = "Selecione ao menos uma especialidade";
    if (!form.street.trim()) e.street = "Campo obrigatório";
    if (!form.number.trim()) e.number = "Campo obrigatório";
    if (!form.neighborhood.trim()) e.neighborhood = "Campo obrigatório";
    if (!form.city.trim()) e.city = "Campo obrigatório";
    if (!form.state.trim()) e.state = "Campo obrigatório";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      onSaved(null);
    }
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    const cleanPhone = cleanDigits(form.phone);
    const cleanCpf = cleanDigits(form.cpf);
    const cleanCep = cleanDigits(form.cep);

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: cleanPhone,
      cro: form.cro.trim(),
      specialties: form.specialties,
      status: form.status,
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim() || null,
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      cep: cleanCep,
      cpf: cleanCpf,
    };

    if (!editDentist && scheduleDraft.length > 0) {
      body.schedules = scheduleDraft;
    }

    try {
      const url = editDentist
        ? `${API_URL}/dentists/${editDentist.id}`
        : `${API_URL}/dentists`;
      const method = editDentist ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (r.ok) {
        onSaved(editDentist ? "Dentista atualizado!" : "Dentista criado!");
        return;
      }

      const data = await r.json().catch(() => null);
      const detail = data?.detail ?? data?.message ?? "";
      const lowerDetail =
        typeof detail === "string" ? detail.toLowerCase() : "";
      let newErrors = null;

      if (r.status === 409) {
        // Duplicidade de CPF, CRO ou e-mail nesta clínica
        if (lowerDetail.includes("cpf")) {
          newErrors = { cpf: detail };
        } else if (lowerDetail.includes("cro")) {
          newErrors = { cro: detail };
        } else if (
          lowerDetail.includes("e‑mail") ||
          lowerDetail.includes("e-mail") ||
          lowerDetail.includes("email")
        ) {
          newErrors = { email: detail };
        } else {
          newErrors = { cro: detail };
        }
      } else if (r.status === 400) {
        // CPF ou telefone inválidos (validação de negócio no backend)
        if (lowerDetail.includes("cpf")) {
          newErrors = { cpf: detail };
        } else if (lowerDetail.includes("telefone")) {
          newErrors = { phone: detail };
        } else {
          onSaved(null);
        }
      } else if (r.status === 404) {
        onSaved(null);
      } else {
        onSaved(null);
      }

      if (newErrors) {
        setErrors(newErrors);
        onSaved(null);
      }
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

  function setMasked(field, formatter) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: formatter(e.target.value) }));
      setErrors((err) => ({ ...err, [field]: undefined }));
      if (field === "cep") setCepLookupError("");
    };
  }

  async function handleCepSearch() {
    const digits = cleanDigits(form.cep);
    if (digits.length !== 8) {
      setCepLookupError("Informe um CEP com 8 dígitos.");
      return;
    }

    setCepLoading(true);
    setCepLookupError("");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado");

      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
        complement: f.complement || data.complemento || "",
      }));
      setErrors((err) => ({
        ...err,
        street: undefined,
        neighborhood: undefined,
        city: undefined,
        state: undefined,
      }));
    } catch {
      setCepLookupError("Não foi possível encontrar este CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  function toggleSpecialty(spec) {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(spec)
        ? f.specialties.filter((s) => s !== spec)
        : [...f.specialties, spec],
    }));
    setErrors((err) => ({ ...err, specialties: undefined }));
  }

  async function addCustomSpecialty() {
    const value = newSpecialtyInput.trim();
    if (!value) return;

    const normalizedValue = value.toLowerCase();
    const alreadyExists = [...form.specialties, ...usedSpecialties].some(
      (s) => s.toLowerCase() === normalizedValue,
    );

    if (alreadyExists) {
      setNewSpecialtyInput("");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/dentists/specialties`, {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: value }),
      });

      const createdValue = response.ok
        ? ((await response.json().catch(() => null))?.name ?? value)
        : value;

      setUsedSpecialties((prev) =>
        Array.from(new Set([...prev, createdValue])),
      );
      setForm((f) => ({
        ...f,
        specialties: [...f.specialties, createdValue],
      }));
      setErrors((err) => ({ ...err, specialties: undefined }));
    } catch {
      setUsedSpecialties((prev) => Array.from(new Set([...prev, value])));
      setForm((f) => ({
        ...f,
        specialties: [...f.specialties, value],
      }));
      setErrors((err) => ({ ...err, specialties: undefined }));
    } finally {
      setNewSpecialtyInput("");
    }
  }

  function addScheduleDraft() {
    setScheduleDraft((list) => [...list, newScheduleItem]);
    setNewScheduleItem(EMPTY_SCHEDULE);
  }

  function removeScheduleDraft(index) {
    setScheduleDraft((list) => list.filter((_, i) => i !== index));
  }

  const dayLabel = (v) => DAYS_OF_WEEK.find((d) => d.value === v)?.label ?? v;
  const fmt = (t) => (t ? t.slice(0, 5) : t);

  // Agrupa o rascunho de horários por dia da semana, igual ao que
  // DentistSchedules faz com os horários já salvos no backend.
  function groupSchedules(list) {
    const grouped = [...list]
      .map((item, index) => ({ ...item, _draftIndex: index }))
      .sort(
        (a, b) =>
          a.day_of_week - b.day_of_week ||
          a.time_begin.localeCompare(b.time_begin),
      )
      .reduce((acc, item) => {
        const key = item.day_of_week;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, items]) => ({ day: Number(day), items }));
  }

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {editDentist ? "Editar dentista" : "Novo dentista"}
          </div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loadingDetail ? (
          <div className="table-loading">Carregando dados do dentista...</div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Nome <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.name ? "input-error" : ""}`}
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Ex: Pedro Augusto da Silva"
                />
                {errors.name && (
                  <span className="form-error">{errors.name}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  CRO <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.cro ? "input-error" : ""}`}
                  value={form.cro}
                  onChange={set("cro")}
                  placeholder="123456-SP"
                />
                {errors.cro && <span className="form-error">{errors.cro}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  E-mail <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.email ? "input-error" : ""}`}
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="pedro.augusto@clinica.com"
                />
                {errors.email && (
                  <span className="form-error">{errors.email}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Telefone <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.phone ? "input-error" : ""}`}
                  value={form.phone}
                  onChange={setMasked("phone", formatPhone)}
                  placeholder="(11) 99988-1111"
                  inputMode="numeric"
                />
                {errors.phone && (
                  <span className="form-error">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                CPF <span className="req">*</span>
              </label>
              <input
                className={`form-input ${errors.cpf ? "input-error" : ""}`}
                value={form.cpf}
                onChange={setMasked("cpf", formatCpf)}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
              {errors.cpf && <span className="form-error">{errors.cpf}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="filter-select"
                  value={form.status}
                  onChange={set("status")}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Especialidades <span className="req">*</span>
              </label>
              <div
                className={`cat-grid ${errors.specialties ? "cat-error" : ""}`}
              >
                {specialtySuggestions.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    className={`cat-chip ${form.specialties.includes(spec) ? "selected" : ""}`}
                    onClick={() => toggleSpecialty(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>
              {errors.specialties && (
                <span className="form-error">{errors.specialties}</span>
              )}

              <div className="specialty-add-row">
                <input
                  className="form-input"
                  list="specialty-suggestions"
                  value={newSpecialtyInput}
                  onChange={(e) => setNewSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSpecialty();
                    }
                  }}
                  placeholder="Não achou? Digite uma nova especialidade..."
                />
                <datalist id="specialty-suggestions">
                  {specialtySuggestions.map((spec) => (
                    <option key={spec} value={spec} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={addCustomSpecialty}
                >
                  + Adicionar
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CEP</label>
              <div className="specialty-add-row">
                <input
                  className={`form-input ${errors.cep ? "input-error" : ""}`}
                  value={form.cep}
                  onChange={setMasked("cep", formatCep)}
                  onBlur={handleCepSearch}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCepSearch();
                    }
                  }}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCepSearch}
                  disabled={cepLoading}
                >
                  {cepLoading ? "Buscando..." : "Buscar CEP"}
                </button>
              </div>
              {errors.cep && <span className="form-error">{errors.cep}</span>}
              {cepLookupError && (
                <span className="form-error">{cepLookupError}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">
                  Rua <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.street ? "input-error" : ""}`}
                  value={form.street}
                  onChange={set("street")}
                />
                {errors.street && (
                  <span className="form-error">{errors.street}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Número <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.number ? "input-error" : ""}`}
                  value={form.number}
                  onChange={set("number")}
                />
                {errors.number && (
                  <span className="form-error">{errors.number}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Complemento</label>
                <input
                  className="form-input"
                  value={form.complement}
                  onChange={set("complement")}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Bairro <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.neighborhood ? "input-error" : ""}`}
                  value={form.neighborhood}
                  onChange={set("neighborhood")}
                />
                {errors.neighborhood && (
                  <span className="form-error">{errors.neighborhood}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Cidade <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.city ? "input-error" : ""}`}
                  value={form.city}
                  onChange={set("city")}
                />
                {errors.city && (
                  <span className="form-error">{errors.city}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Estado <span className="req">*</span>
                </label>
                <input
                  className={`form-input ${errors.state ? "input-error" : ""}`}
                  value={form.state}
                  onChange={set("state")}
                  placeholder="SP"
                  maxLength={2}
                />
                {errors.state && (
                  <span className="form-error">{errors.state}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Horários de atendimento</label>

              {editDentist ? (
                <DentistSchedules dentistId={editDentist.id} token={token} />
              ) : (
                <div className="schedule-manager">
                  {scheduleDraft.length === 0 ? (
                    <p className="form-hint">
                      Nenhum horário adicionado ainda.
                    </p>
                  ) : (
                    <ul className="schedule-list">
                      {groupSchedules(scheduleDraft).map(({ day, items }) => (
                        <li key={day} className="schedule-row schedule-row-grouped">
                          <div className="schedule-day-block">
                            <span className="schedule-day-name">
                              {dayLabel(day)}
                            </span>
                            <div className="schedule-time-list">
                              {items.map((s) => (
                                <span
                                  key={s._draftIndex}
                                  className="schedule-time-chip"
                                >
                                  {fmt(s.time_begin)} às {fmt(s.time_end)}
                                  <button
                                    type="button"
                                    className="btn-icon del"
                                    onClick={() =>
                                      removeScheduleDraft(s._draftIndex)
                                    }
                                    title="Remover"
                                  >
                                    🗑️
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="schedule-add-row">
                    <select
                      className="filter-select"
                      value={newScheduleItem.day_of_week}
                      onChange={(e) =>
                        setNewScheduleItem((f) => ({
                          ...f,
                          day_of_week: Number(e.target.value),
                        }))
                      }
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      className="form-input"
                      value={newScheduleItem.time_begin}
                      onChange={(e) =>
                        setNewScheduleItem((f) => ({
                          ...f,
                          time_begin: e.target.value,
                        }))
                      }
                    />
                    <span>às</span>
                    <input
                      type="time"
                      className="form-input"
                      value={newScheduleItem.time_end}
                      onChange={(e) =>
                        setNewScheduleItem((f) => ({
                          ...f,
                          time_end: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={addScheduleDraft}
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}