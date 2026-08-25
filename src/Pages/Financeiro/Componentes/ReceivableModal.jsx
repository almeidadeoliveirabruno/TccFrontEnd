import { useState, useEffect } from "react";
import { API_URL, authHeaders } from "../../../utils/api";

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
];


function toDateInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayAsDateInput() {
  return toDateInput(new Date().toISOString());
}

function dateInputToIso(dateStr) {
  return `${dateStr}T12:00:00`;
}

export default function ReceivableModal({
  open,
  appointmentId,
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
  const [cancelling, setCancelling] = useState(false);
  const [receivable, setReceivable] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [error, setError] = useState("");

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
        setPaymentMethod(d.payment_method ?? "");
        setPaidAt(d.paid_at ? toDateInput(d.paid_at) : todayAsDateInput());
      })
      .catch(() => setError("Erro ao carregar dados financeiros dessa consulta."))
      .finally(() => setLoading(false));
  }, [open, appointmentId, token]);

  async function handleSave() {
    if (!receivable) return;
    if (!paymentMethod) {
      setError("Selecione a forma de pagamento.");
      return;
    }
    if (!paidAt) {
      setError("Informe a data do pagamento.");
      return;
    }
    if (paidAt > todayAsDateInput()) {
      setError("Data de pagamento não pode ser no futuro.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const isoDate = dateInputToIso(paidAt);
      let r;
      if (receivable.status !== "pago") {
        const params = new URLSearchParams({
          payment_method: paymentMethod,
          paid_at: isoDate,
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
            paid_at: isoDate,
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

  async function handleCancel() {
    if (!receivable) return;
    if (!window.confirm("Cancelar a cobrança dessa consulta (paciente faltou)?")) return;
    setCancelling(true);
    setError("");
    try {
      const r = await fetch(`${API_URL}/receivables/${receivable.id}/cancel`, {
        method: "POST",
        headers: authHeaders(token),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.detail || "Erro ao cancelar cobrança.");
      }
      onSaved("Cobrança cancelada.");
    } catch (e) {
      setError(e.message || "Erro ao cancelar cobrança.");
    } finally {
      setCancelling(false);
    }
  }

  const isPago = receivable?.status === "pago";
  const isCancelado = receivable?.status === "cancelado";

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
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  R$ {Number(totalPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {isCancelado ? (
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="form-input" style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                  Cobrança cancelada — não é possível editar.
                </div>
              </div>
            ) : (
              <>
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

                {isPago && (
                  <div className="proc-desc">
                    Essa consulta já está marcada como paga. Alterar e salvar
                    atualiza a forma de pagamento e a data.
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="proc-desc" style={{ color: "#B91C1C" }}>
                {error}
              </div>
            )}
          </>
        )}

        <div className="modal-footer">
          {!loading && !notFound && !isCancelado && receivable?.status === "pendente" && (
            <button
              className="btn-cancel"
              style={{ color: "#B91C1C", borderColor: "#FECACA" }}
              onClick={handleCancel}
              disabled={cancelling || saving}
            >
              {cancelling ? "Cancelando..." : "Paciente faltou (cancelar)"}
            </button>
          )}
          {!notFound && !isCancelado && (
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || loading || cancelling}
            >
              {saving ? "Salvando..." : "Confirmar pagamento"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}