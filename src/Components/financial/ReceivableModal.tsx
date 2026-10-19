import { useState, useEffect } from "react";
import "./ReceivableModal.css";
import ConfirmModal from "../common/ConfirmModal/ConfirmModal";
import {
  getReceivableByAppointment,
  payReceivable,
  unpayReceivable,
  updateReceivable,
  cancelReceivable,
  reactivateReceivable,
} from "../../Services/receivableService";

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
];

function toDateInput(val) {
  if (!val) return "";
  return String(val).split("T")[0];
}

function todayAsDateInput() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReceivableModal({
  open,
  appointmentId,
  appointmentStatus,
  patientName,
  dentistName,
  appointmentTime,
  totalPrice,
  onClose,
  onSaved,
  token,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receivable, setReceivable] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // "pago" | "pendente"
  const [statusSelection, setStatusSelection] = useState("pendente");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [error, setError] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const isConsultaCancelada = appointmentStatus === "cancelado";
  const isReceivableCancelado = receivable?.status === "cancelado";
  const isCancelado = isReceivableCancelado || (isConsultaCancelada && receivable?.status !== "pago");

  useEffect(() => {
    if (!open || !appointmentId) {
      setReceivable(null);
      setNotFound(false);
      setError("");
      setCancelConfirmOpen(false);
      return;
    }
    setLoading(true);
    setError("");
    setNotFound(false);
    setCancelConfirmOpen(false);
    getReceivableByAppointment(token, appointmentId)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setReceivable(d);
        const currentStatus = d.status === "pago" ? "pago" : "pendente";
        setStatusSelection(currentStatus);
        setPaymentMethod(d.payment_method ?? "pix");
        setPaidAt(d.paid_at ? toDateInput(d.paid_at) : todayAsDateInput());
      })
      .catch(() => setError("Erro ao carregar dados financeiros dessa consulta."))
      .finally(() => setLoading(false));
  }, [open, appointmentId, token]);

  async function handleSave() {
    if (!receivable) return;
    if (isCancelado) {
      setError(
        isConsultaCancelada
          ? "Não é possível alterar pagamento de uma consulta cancelada."
          : "Não é possível alterar uma cobrança cancelada."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Caso 1: Usuário selecionou status "pendente"
      if (statusSelection === "pendente") {
        if (receivable.status === "pago") {
          const r = await unpayReceivable(token, receivable.id);
          if (!r.ok) {
            const body = await r.json().catch(() => null);
            throw new Error(body?.detail || "Erro ao reverter pagamento para pendente.");
          }
          onSaved("Status de pagamento alterado para Pendente.");
          return;
        } else {
          // Já estava pendente
          onSaved("Cobrança mantida como Pendente.");
          return;
        }
      }

      // Caso 2: Usuário selecionou status "pago"
      if (!paymentMethod) {
        setError("Selecione a forma de pagamento.");
        setSaving(false);
        return;
      }
      if (!paidAt) {
        setError("Informe a data do pagamento.");
        setSaving(false);
        return;
      }
      if (paidAt > todayAsDateInput()) {
        setError("Data de pagamento não pode ser no futuro.");
        setSaving(false);
        return;
      }

      let r;
      if (receivable.status !== "pago") {
        r = await payReceivable(token, receivable.id, {
          paymentMethod,
          paidAt,
        });
      } else {
        r = await updateReceivable(token, receivable.id, {
          payment_method: paymentMethod,
          paid_at: paidAt,
        });
      }

      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.detail || "Erro ao salvar pagamento.");
      }
      onSaved("Pagamento registrado com sucesso!");
    } catch (e) {
      setError(e.message || "Erro ao salvar pagamento.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelReceivable() {
    if (!receivable) return;
    setError("");
    setCancelConfirmOpen(true);
  }

  async function handleConfirmCancel() {
    if (!receivable) return;
    setSaving(true);
    setError("");
    try {
      const r = await cancelReceivable(token, receivable.id);
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.detail || "Erro ao cancelar cobrança.");
      }
      setCancelConfirmOpen(false);
      onSaved(
        receivable.status === "pago"
          ? "Cobrança cancelada e pagamento estornado com sucesso!"
          : isConsultaCancelada
          ? "Cobrança cancelada com sucesso!"
          : "Cobrança cancelada com sucesso! A consulta permanece agendada normalmente."
      );
    } catch (e) {
      setError(e.message || "Erro ao cancelar cobrança.");
      setCancelConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleReactivateReceivable() {
    if (!receivable) return;
    setSaving(true);
    setError("");
    try {
      const r = await reactivateReceivable(token, receivable.id);
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.detail || "Erro ao reativar cobrança.");
      }
      onSaved("Cobrança reativada como Pendente!");
    } catch (e) {
      setError(e.message || "Erro ao reativar cobrança.");
    } finally {
      setSaving(false);
    }
  }

  const isPagoOriginally = receivable?.status === "pago";

  return (
    <>
      <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Pagamento da consulta</div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading || (!receivable && !notFound) ? (
          <div className="table-loading">Carregando...</div>
        ) : notFound ? (
          <div className="table-loading">
            Nenhuma cobrança encontrada para essa consulta.
          </div>
        ) : !receivable ? null : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paciente</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {patientName}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dentista</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {dentistName}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data / Hora da consulta</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {appointmentTime}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Valor total</label>
                <div className="form-input" style={{ background: "#F9FAFB", fontWeight: 600, color: "#16a34a" }}>
                  R$ {Number(totalPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {isConsultaCancelada ? (
              receivable?.status === "pago" ? (
                <div
                  style={{
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                    color: "#92400E",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    margin: "12px 0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px" }}>⚠️</span>
                    <div>
                      <strong style={{ fontSize: "14px", color: "#78350F" }}>
                        Consulta Cancelada com Pagamento Registrado
                      </strong>
                      <p style={{ margin: "4px 0 0", color: "#92400E", lineHeight: "1.45" }}>
                        Esta consulta foi cancelada na agenda, porém ainda consta como <strong>paga</strong> (R$ {Number(totalPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}{receivable.payment_method ? ` via ${receivable.payment_method.toUpperCase()}` : ""}).
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed #FCD34D",
                      paddingTop: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#A16207" }}>
                      Houve estorno ou o valor será cobrado na próxima consulta?
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelReceivable}
                      disabled={saving || loading}
                      style={{
                        background: "#FFF1F2",
                        border: "1px solid #FECDD3",
                        color: "#E11D48",
                        borderRadius: "8px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      title="Cancela a cobrança e anula o pagamento registrado no financeiro"
                    >
                      🚫 Cancelar cobrança (Estornar)
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    margin: "8px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>⚠️</span>
                  <span>Esta consulta está cancelada e a cobrança financeira está cancelada.</span>
                </div>
              )
            ) : receivable?.status === "cancelado" ? (
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  padding: "12px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  margin: "8px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "16px" }}>ℹ️</span>
                  <div>
                    <strong>Cobrança Cancelada / Isenta</strong>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: 2 }}>
                      A consulta permanece agendada, mas não há cobrança financeira gerada (retorno/cortesia).
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReactivateReceivable}
                  disabled={saving}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #94A3B8",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0F172A",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  title="Reativar esta cobrança como Pendente"
                >
                  Reativar cobrança
                </button>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Status do Pagamento</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setStatusSelection("pago")}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: statusSelection === "pago" ? "2px solid #16a34a" : "1px solid #E5E7EB",
                        background: statusSelection === "pago" ? "#DCFCE7" : "#F9FAFB",
                        color: statusSelection === "pago" ? "#15803D" : "#4B5563",
                        fontWeight: statusSelection === "pago" ? 600 : 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>✓</span> Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusSelection("pendente")}
                      style={{
                        flex: 1,
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: statusSelection === "pendente" ? "2px solid #f59e0b" : "1px solid #E5E7EB",
                        background: statusSelection === "pendente" ? "#FEF3C7" : "#F9FAFB",
                        color: statusSelection === "pendente" ? "#B45309" : "#4B5563",
                        fontWeight: statusSelection === "pendente" ? 600 : 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>⏳</span> Pendente
                    </button>
                  </div>
                </div>

                {statusSelection === "pago" ? (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Forma de pagamento</label>
                      <select
                        className="form-input"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data do pagamento</label>
                      <input
                        type="date"
                        className="form-input"
                        value={paidAt}
                        max={todayAsDateInput()}
                        onChange={(e) => setPaidAt(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="proc-desc"
                    style={{
                      background: "#FEF3C7",
                      color: "#92400E",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12.5,
                      marginTop: 4,
                    }}
                  >
                    A consulta ficará registrada como <strong>Pendente</strong> de pagamento.
                  </div>
                )}

                {receivable?.status !== "pago" && (
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px dashed #E2E8F0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      Não deve cobrar esta consulta? (Retorno/Cortesia)
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelReceivable}
                      disabled={saving || loading}
                      style={{
                        background: "#FFF1F2",
                        border: "1px solid #FECDD3",
                        color: "#E11D48",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      title="Cancela apenas a cobrança financeira, mantendo a consulta normalmente agendada."
                    >
                      🚫 Cancelar cobrança
                    </button>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="proc-desc" style={{ color: "#B91C1C", marginTop: 8 }}>
                {error}
              </div>
            )}
          </>
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            {isConsultaCancelada || isReceivableCancelado ? "Fechar" : "Cancelar"}
          </button>

          {!notFound && !isConsultaCancelada && !isReceivableCancelado && receivable && (
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving
                ? "Salvando..."
                : statusSelection === "pago"
                ? isPagoOriginally
                  ? "Salvar alterações"
                  : "Confirmar pagamento"
                : "Salvar como Pendente"}
            </button>
          )}
        </div>
      </div>
    </div>

      <ConfirmModal
        open={cancelConfirmOpen}
        title={
          receivable?.status === "pago"
            ? isConsultaCancelada
              ? "Cancelar cobrança e estornar pagamento"
              : "Cancelar cobrança e anular pagamento"
            : "Cancelar cobrança"
        }
        icon="🚫"
        danger={true}
        confirmLabel={receivable?.status === "pago" ? "Sim, cancelar e estornar" : "Sim, cancelar cobrança"}
        loadingLabel="Cancelando..."
        loading={saving}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelConfirmOpen(false)}
        message={
          receivable?.status === "pago" ? (
            <div>
              <p style={{ margin: "0 0 12px", color: "#334155" }}>
                {isConsultaCancelada
                  ? "Esta consulta foi cancelada, mas consta com pagamento registrado. Deseja cancelar a cobrança e anular este pagamento?"
                  : "Esta cobrança consta como paga. Deseja cancelar a cobrança e anular o pagamento?"}
              </p>
              <div
                style={{
                  background: "#FFF1F2",
                  border: "1px solid #FECDD3",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#9F1239",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ marginBottom: "6px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span>💳</span>
                  <span>
                    O pagamento de <strong>R$ {Number(totalPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> será anulado.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span>📉</span>
                  <span>O valor deixará de contar como receita recebida no faturamento da clínica.</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 12px", color: "#334155" }}>
                Deseja realmente cancelar a cobrança desta consulta?
              </p>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: "#475569",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ marginBottom: "6px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span>📅</span>
                  <span>A consulta <strong>permanecerá agendada</strong> normalmente.</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span>💳</span>
                  <span>Apenas a cobrança financeira será cancelada (isenta de pagamento).</span>
                </div>
              </div>
            </div>
          )
        }
      />
    </>
  );
}