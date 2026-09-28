import { useState, useEffect } from "react";
import "./ReceivableModal.css";
import { API_URL, authHeaders } from "../../Services/api";

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

  const isConsultaCancelada = appointmentStatus === "cancelado";
  const isCancelado = receivable?.status === "cancelado" || isConsultaCancelada;

  useEffect(() => {
    if (!open || !appointmentId) return;
    setLoading(true);
    setError("");
    setNotFound(false);
    fetch(`${API_URL}/receivables/by-appointment/${appointmentId}`, {
      headers: authHeaders(token),
    })
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
          const r = await fetch(`${API_URL}/receivables/${receivable.id}/unpay`, {
            method: "POST",
            headers: authHeaders(token),
          });
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
        const params = new URLSearchParams({
          payment_method: paymentMethod,
          paid_at: paidAt,
        });
        r = await fetch(`${API_URL}/receivables/${receivable.id}/pay?${params}`, {
          method: "POST",
          headers: authHeaders(token),
        });
      } else {
        r = await fetch(`${API_URL}/receivables/${receivable.id}`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify({
            payment_method: paymentMethod,
            paid_at: paidAt,
          }),
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

  const isPagoOriginally = receivable?.status === "pago";

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Pagamento da consulta</div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Carregando...</div>
        ) : notFound ? (
          <div className="table-loading">
            Nenhuma cobrança encontrada para essa consulta.
          </div>
        ) : (
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

            {isCancelado ? (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  color: "#991B1B",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  margin: "8px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>⚠️</span>
                <span>
                  {isConsultaCancelada
                    ? "Esta consulta está cancelada. Lançamento financeiro bloqueado."
                    : "Esta cobrança está cancelada e bloqueada para alterações."}
                </span>
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
            {isCancelado ? "Fechar" : "Cancelar"}
          </button>

          {!notFound && !isCancelado && (
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
  );
}