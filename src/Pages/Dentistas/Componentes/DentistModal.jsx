import { useState, useEffect } from "react";
import {
  SPECIALTIES,
  STATUS_OPTIONS,
  EMPTY_FORM,
  DAYS_OF_WEEK,
  EMPTY_SCHEDULE,
} from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";
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
  const [fullCpf, setFullCpf] = useState(""); // só exibição, não editável
  const [scheduleDraft, setScheduleDraft] = useState([]); // só usado na criação
  const [newScheduleItem, setNewScheduleItem] = useState(EMPTY_SCHEDULE);
  const [usedSpecialties, setUsedSpecialties] = useState([]);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState("");

  // Sugestões = lista fixa (pontos de partida comuns) + o que a própria
  // clínica já usou em outros dentistas, sem repetir.
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
      // Busca o detalhe completo: a linha da tabela só tem os campos da
      // listagem (sem endereço). Sem isso, salvar sobrescreveria o
      // endereço real com campos em branco.
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
            cpf: "",
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
          setFullCpf(data.cpf ?? "");
        })
        .catch(() => setForm(EMPTY_FORM))
        .finally(() => setLoadingDetail(false));
    } else {
      setForm(EMPTY_FORM);
      setFullCpf("");
      setScheduleDraft([]);
      setNewScheduleItem(EMPTY_SCHEDULE);
    }
  }, [open, editDentist, token]);

  function validate() {
    const e = {};
    const cleanPhone = cleanDigits(form.phone);
    const cleanCpf = cleanDigits(form.cpf);

    if (!form.name.trim()) e.name = "Campo obrigatório";
    if (!form.email.trim()) e.email = "Campo obrigatório";
    if (!cleanPhone) e.phone = "Campo obrigatório";
    if (!editDentist && !cleanCpf) e.cpf = "Campo obrigatório";
    if (!form.cro.trim()) e.cro = "Campo obrigatório";
    if (form.specialties.length === 0)
      e.specialties = "Selecione ao menos uma especialidade";
    if (!form.street.trim()) e.street = "Campo obrigatório";
    if (!form.number.trim()) e.number = "Campo obrigatório";
    if (!form.neighborhood.trim()) e.neighborhood = "Campo obrigatório";
    if (!form.city.trim()) e.city = "Campo obrigatório";
    if (!form.state.trim()) e.state = "Campo obrigatório";
    setErrors(e);
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
    };
    // CPF só vai no corpo na criação — a rota de update não aceita trocar CPF.
    if (!editDentist) {
      body.cpf = cleanCpf;
      // Horários também só vão junto na criação. Em edição, os horários
      // já existem de forma independente e são gerenciados pelo painel
      // DentistSchedules (cada ação lá já persiste na hora).
      if (scheduleDraft.length > 0) {
        body.schedules = scheduleDraft;
      }
    }

    try {
      const url = editDentist
        ? `${API_URL}/dentists/${editDentist.id}`
        : `${API_URL}/dentists`;
      const method = editDentist ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      if (r.status === 409) {
        setErrors({ cpf: "Já existe um dentista com esse CPF nesta clínica" });
        return;
      }
      if (!r.ok) throw new Error();
      onSaved(editDentist ? "Dentista atualizado!" : "Dentista criado!");
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
                  placeholder="Ex: Carlos Eduardo Santos"
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
                  placeholder="SP 123456"
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
                  placeholder="carlos.eduardo@clinica.com"
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

            {editDentist ? (
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input className="form-input" value={fullCpf} disabled />
                <span className="form-hint">
                  CPF não pode ser alterado após o cadastro
                </span>
              </div>
            ) : (
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
            )}

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
                      {scheduleDraft.map((s, i) => (
                        <li key={i} className="schedule-row">
                          <span>
                            {dayLabel(s.day_of_week)} · {s.time_begin} às{" "}
                            {s.time_end}
                          </span>
                          <button
                            type="button"
                            className="btn-icon del"
                            onClick={() => removeScheduleDraft(i)}
                            title="Remover"
                          >
                            🗑️
                          </button>
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
