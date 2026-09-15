import { useState, useEffect } from "react";
import { GENDER_OPTIONS, EMPTY_PATIENT_FORM } from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";
import { validarCPF, validarTelefone } from "../../../utils/validators";
import {
  cleanDigits,
  formatCep,
  formatCpf,
  formatPhone,
} from "../../../utils/masks";

export default function PatientModal({ open, editPatient, onClose, onSaved, token }) {
  const [form, setForm] = useState(EMPTY_PATIENT_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepLookupError, setCepLookupError] = useState("");

  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (editPatient) {
      setLoadingDetail(true);
      fetch(`${API_URL}/patients/${editPatient.id}`, {
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
            cpf: formatCpf(data.cpf ?? ""),
            birth_date: data.birth_date ?? "",
            gender: data.gender ?? "",
            health_plan: data.health_plan ?? "",
            profession: data.profession ?? "",
            observations: data.observations ?? "",
            street: data.street,
            number: data.number,
            complement: data.complement ?? "",
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            cep: formatCep(data.cep ?? ""),
          });
        })
        .catch(() => setForm(EMPTY_PATIENT_FORM))
        .finally(() => setLoadingDetail(false));
    } else {
      setForm(EMPTY_PATIENT_FORM);
    }
  }, [open, editPatient, token]);

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

    if (!form.birth_date) e.birth_date = "Campo obrigatório";
    else if (form.birth_date > new Date().toISOString().split("T")[0]) {
      e.birth_date = "A data de nascimento não pode ser no futuro";
    }
    if (!form.gender) e.gender = "Campo obrigatório";
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

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: cleanDigits(form.phone),
      cpf: cleanDigits(form.cpf),
      birth_date: form.birth_date,
      gender: form.gender,
      observations: form.observations.trim() || null,
      health_plan: form.health_plan.trim() || null,
      profession: form.profession.trim() || null,
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim() || null,
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      cep: cleanDigits(form.cep),
    };

    try {
      const url = editPatient
        ? `${API_URL}/patients/${editPatient.id}`
        : `${API_URL}/patients`;
      const method = editPatient ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (r.ok) {
        onSaved(editPatient ? "Paciente atualizado!" : "Paciente criado!");
        return;
      }

      const data = await r.json().catch(() => null);
      const detail = data?.detail ?? "";
      const lowerDetail = typeof detail === "string" ? detail.toLowerCase() : "";
      let newErrors = null;

      if (r.status === 409) {
        // CPF duplicado nesta clínica
        newErrors = { cpf: detail };
      } else if (r.status === 422 && lowerDetail.includes("e-mail")) {
        newErrors = { email: detail };
      } else if (r.status === 422 && lowerDetail.includes("cpf")) {
        newErrors = { cpf: detail };
      } else if (r.status === 422 && lowerDetail.includes("telefone")) {
        newErrors = { phone: detail };
      } else if (r.status === 422 && lowerDetail.includes("nascimento")) {
        newErrors = { birth_date: detail };
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

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {editPatient ? "Editar paciente" : "Novo paciente"}
          </div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loadingDetail ? (
          <div className="table-loading">Carregando dados do paciente...</div>
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
                  placeholder="Ex: João da Silva"
                />
                {errors.name && (
                  <span className="form-error">{errors.name}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Data de nascimento <span className="req">*</span>
                </label>
                <input
                  type="date"
                  max={todayStr}
                  className={`form-input ${errors.birth_date ? "input-error" : ""}`}
                  value={form.birth_date}
                  onChange={set("birth_date")}
                />
                {errors.birth_date && (
                  <span className="form-error">{errors.birth_date}</span>
                )}
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
                  placeholder="joao@email.com"
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
                  placeholder="(11) 99999-1111"
                  inputMode="numeric"
                />
                {errors.phone && (
                  <span className="form-error">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-row">
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
              <div className="form-group">
                <label className="form-label">
                  Gênero <span className="req">*</span>
                </label>
                <select
                  className={`filter-select ${errors.gender ? "input-error" : ""}`}
                  value={form.gender}
                  onChange={set("gender")}
                  style={{ width: "100%" }}
                >
                  <option value="">Selecione...</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <span className="form-error">{errors.gender}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Convênio</label>
                <input
                  className="form-input"
                  value={form.health_plan}
                  onChange={set("health_plan")}
                  placeholder="Ex: Amil Dental"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Profissão</label>
                <input
                  className="form-input"
                  value={form.profession}
                  onChange={set("profession")}
                  placeholder="Ex: Professor"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                CEP 
              </label>
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

            <div className="form-group anamnesis-field">
              <label className="form-label anamnesis-label">
                <i className="ti ti-stethoscope" aria-hidden="true" />
                Observações / Anamnese
              </label>
              <p className="anamnesis-hint">
                Registre condições de saúde, alergias, medicamentos em uso ou
                qualquer informação relevante para o atendimento.
              </p>
              <textarea
                className="form-input anamnesis-textarea"
                rows={5}
                value={form.observations}
                onChange={set("observations")}
                placeholder="Ex: Paciente alérgico a penicilina, histórico de hipertensão, sensibilidade dentária..."
              />
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