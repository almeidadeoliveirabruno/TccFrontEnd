import React, { useState, useEffect, useCallback } from "react";
import { X, User, Building2, FileText, Mail, Loader2, AlertCircle, Check } from "lucide-react";
import { getProfile, updateProfile } from "../../../Services/auth";
import { formatCnpj } from "../../../utils/masks";
import { validarCNPJ } from "../../../utils/validators";
import "./ProfileModal.css";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (
    userData: {
      id: number;
      email: string;
      nome: string;
      clinic: { id: string; nome: string; cnpj: string };
    },
    newToken: string
  ) => void;
  token: string | null;
}

export default function ProfileModal({
  open,
  onClose,
  onSaved,
  token,
}: ProfileModalProps) {
  const [nome, setNome] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");

  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    setGeneralError("");
    setErrors({});
    try {
      const res = await getProfile(token);
      if (!res.ok) {
        throw new Error("Erro ao carregar dados do perfil");
      }
      const data = await res.json();
      setNome(data.nome || "");
      setEmail(data.email || "");
      setNomeClinica(data.clinic?.nome || "");
      setCnpj(formatCnpj(data.clinic?.cnpj || ""));
    } catch {
      setGeneralError("Não foi possível carregar os dados atuais.");
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open, loadProfile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saving, onClose]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    const cleanNome = nome.trim();
    if (!cleanNome) {
      nextErrors.nome = "Nome é obrigatório";
    } else if (cleanNome.length < 2) {
      nextErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

    const cleanNomeClinica = nomeClinica.trim();
    if (!cleanNomeClinica) {
      nextErrors.nomeClinica = "Nome da clínica é obrigatório";
    } else if (cleanNomeClinica.length < 2) {
      nextErrors.nomeClinica = "Nome da clínica deve ter pelo menos 2 caracteres";
    }

    const cleanCnpjDigits = cnpj.replace(/\D/g, "");
    if (!cleanCnpjDigits) {
      nextErrors.cnpj = "CNPJ é obrigatório";
    } else if (!validarCNPJ(cleanCnpjDigits)) {
      nextErrors.cnpj = "CNPJ inválido";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setGeneralError("");
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        nome_clinica: nomeClinica.trim(),
        cnpj: cnpj.replace(/\D/g, ""),
      };

      const res = await updateProfile(token, payload);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail || "Erro ao atualizar dados";
        const lowerDetail = typeof detail === "string" ? detail.toLowerCase() : "";

        if (lowerDetail.includes("cnpj")) {
          setErrors((prev) => ({ ...prev, cnpj: detail }));
        } else if (lowerDetail.includes("clínica") || lowerDetail.includes("clinica")) {
          setErrors((prev) => ({ ...prev, nomeClinica: detail }));
        } else if (lowerDetail.includes("nome")) {
          setErrors((prev) => ({ ...prev, nome: detail }));
        } else {
          setGeneralError(detail);
        }
        return;
      }

      onSaved(data, data.access_token);
      onClose();
    } catch {
      setGeneralError("Erro de conexão ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="profile-modal-overlay" onClick={() => !saving && onClose()}>
      <div
        className="profile-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div className="profile-modal-header">
          <div>
            <h3 id="profile-modal-title">Dados da Conta e Clínica</h3>
            <p className="profile-modal-subtitle">
              Altere suas informações de perfil e os dados cadastrais da clínica
            </p>
          </div>
          <button
            type="button"
            className="profile-modal-close-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {generalError && (
          <div className="profile-modal-alert profile-modal-alert-error">
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        {loadingData ? (
          <div className="profile-modal-loading">
            <Loader2 className="profile-spinner" size={32} />
            <p>Carregando dados da clínica...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-modal-form" noValidate>
            <div className="profile-modal-body">
              <div className="profile-form-section">
                <span className="profile-section-title">
                  <User size={16} /> Responsável
                </span>

                <div className="profile-field-wrap">
                  <label htmlFor="profile-nome" className="profile-field-label">
                    Nome do usuário
                  </label>
                  <div className="profile-input-container">
                    <input
                      id="profile-nome"
                      type="text"
                      className={`profile-input ${errors.nome ? "input-error" : ""}`}
                      value={nome}
                      placeholder="Ex: Dr. Carlos Eduardo"
                      disabled={saving}
                      onChange={(e) => {
                        setNome(e.target.value);
                        if (errors.nome) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.nome;
                            return next;
                          });
                        }
                      }}
                    />
                  </div>
                  {errors.nome && <span className="profile-field-error">{errors.nome}</span>}
                </div>

                <div className="profile-field-wrap">
                  <label htmlFor="profile-email" className="profile-field-label">
                    E-mail de acesso
                  </label>
                  <div className="profile-input-container read-only">
                    <Mail size={16} className="profile-input-icon" />
                    <input
                      id="profile-email"
                      type="email"
                      className="profile-input readonly-input"
                      value={email}
                      disabled
                      title="O e-mail de acesso não pode ser alterado"
                    />
                  </div>
                  <span className="profile-field-hint">
                    Identificador de login da conta (não editável)
                  </span>
                </div>
              </div>

              <div className="profile-form-section">
                <span className="profile-section-title">
                  <Building2 size={16} /> Informações da Clínica
                </span>

                <div className="profile-field-wrap">
                  <label htmlFor="profile-nome-clinica" className="profile-field-label">
                    Nome da clínica
                  </label>
                  <div className="profile-input-container">
                    <input
                      id="profile-nome-clinica"
                      type="text"
                      className={`profile-input ${errors.nomeClinica ? "input-error" : ""}`}
                      value={nomeClinica}
                      placeholder="Ex: Clínica OdontoLink"
                      disabled={saving}
                      onChange={(e) => {
                        setNomeClinica(e.target.value);
                        if (errors.nomeClinica) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.nomeClinica;
                            return next;
                          });
                        }
                      }}
                    />
                  </div>
                  {errors.nomeClinica && (
                    <span className="profile-field-error">{errors.nomeClinica}</span>
                  )}
                </div>

                <div className="profile-field-wrap">
                  <label htmlFor="profile-cnpj" className="profile-field-label">
                    CNPJ
                  </label>
                  <div className="profile-input-container">
                    <FileText size={16} className="profile-input-icon" />
                    <input
                      id="profile-cnpj"
                      type="text"
                      className={`profile-input ${errors.cnpj ? "input-error" : ""}`}
                      value={cnpj}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      disabled={saving}
                      onChange={(e) => {
                        const formatted = formatCnpj(e.target.value);
                        setCnpj(formatted);
                        if (errors.cnpj) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.cnpj;
                            return next;
                          });
                        }
                      }}
                    />
                  </div>
                  {errors.cnpj && <span className="profile-field-error">{errors.cnpj}</span>}
                </div>
              </div>
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="profile-btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="profile-btn-submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="profile-spinner" size={16} />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
