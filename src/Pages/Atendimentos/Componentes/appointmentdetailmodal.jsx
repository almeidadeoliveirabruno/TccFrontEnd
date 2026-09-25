import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { STATUS_OPTIONS, STATUS_VALUE } from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";
import OdontogramModal from "../../Pacientes/Componentes/OdontogramModal";

// Abre uma consulta JÁ EXISTENTE. Diferente do AtendimentoModal (que serve
// só para CRIAR): aqui não dá pra trocar paciente/dentista/data/procedimentos
// -- só status, o dente de cada procedimento já lançado, e observações.
export default function AppointmentDetailModal({
  open,
  appointmentId,
  onClose,
  onSaved,
  token,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);

  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [procedures, setProcedures] = useState([]); // [{ id, name, tooth }]

  // Odontograma
  const [odoProcId, setOdoProcId] = useState(null); // id do proc com odo aberto

  useEffect(() => {
    if (!open || !appointmentId) return;

    setLoading(true);
    // rota certa: devolve nomes (pacient_name/dentist_name), não IDs
    fetch(`${API_URL}/appointments/table/${appointmentId}`, {
      headers: authHeaders(token),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setDetail(d);
        setStatus(d.status);
        setNotes(d.notes ?? "");
        setProcedures(
          (d.procedures ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            tooth: p.tooth ?? "",
          })),
        );
      })
      .catch(() => onSaved(null))
      .finally(() => setLoading(false));
  }, [open, appointmentId, token]);

  function setTooth(procId, value) {
    setProcedures((list) =>
      list.map((p) => (p.id === procId ? { ...p, tooth: value } : p)),
    );
  }

  async function handleSave() {
    if (!detail) return;
    setSaving(true);
    try {
      // 1. status (só chama se mudou)
      if (status !== detail.status) {
        const r = await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
          method: "PATCH",
          headers: authHeaders(token),
          body: JSON.stringify({ status }),
        });
        if (!r.ok) throw new Error();
      }

      // 2. dente por procedimento (só os que mudaram)
      const originalTeeth = new Map(
        (detail.procedures ?? []).map((p) => [p.id, p.tooth ?? ""]),
      );
      for (const p of procedures) {
        if (p.tooth !== (originalTeeth.get(p.id) ?? "")) {
          const r = await fetch(
            `${API_URL}/appointments/procedures/${p.id}/tooth`,
            {
              method: "PATCH",
              headers: authHeaders(token),
              body: JSON.stringify({ tooth: p.tooth || null }),
            },
          );
          if (!r.ok) throw new Error();
        }
      }

      // 3. observações (só se mudou) -- rota exclusiva, não reaproveita
      // o PUT de edição completa (esse é fluxo de Agenda)
      if (notes !== (detail.notes ?? "")) {
        const r = await fetch(
          `${API_URL}/appointments/${appointmentId}/notes`,
          {
            method: "PATCH",
            headers: authHeaders(token),
            body: JSON.stringify({ notes: notes.trim() || null }),
          },
        );
        if (!r.ok) throw new Error();
      }

      onSaved("Atendimento atualizado!");
    } catch {
      onSaved(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Detalhes do atendimento</div>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading || !detail ? (
          <div className="table-loading">Carregando...</div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paciente</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {detail.pacient_name}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Dentista</label>
                <div className="form-input" style={{ background: "#F9FAFB" }}>
                  {detail.dentist_name}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Data / Hora</label>
              <div className="form-input" style={{ background: "#F9FAFB" }}>
                {detail.time_day}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((label) => (
                  <option key={label} value={STATUS_VALUE[label]}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Procedimentos</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {procedures.map((p) => (
                  <div
                    key={p.id}
                    style={{ display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>
                      {p.name}
                    </span>
                    <button
                      type="button"
                      title="Selecionar dente no odontograma"
                      onClick={() => setOdoProcId(p.id)}
                      style={{
                        background: p.tooth ? "linear-gradient(135deg,#0cb0c7,#0ea5e9)" : "#f1f5f9",
                        border: "1.5px solid " + (p.tooth ? "#0cb0c7" : "#e2e8f0"),
                        borderRadius: 10,
                        minWidth: 64,
                        height: 34,
                        fontSize: p.tooth ? 14 : 16,
                        fontWeight: p.tooth ? 700 : 400,
                        color: p.tooth ? "#fff" : "#94a3b8",
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
                      {p.tooth ? (
                        <>🦷 {p.tooth}</>
                      ) : (
                        <>🦷<span style={{ fontSize: 11, marginLeft: 2 }}>Dente</span></>
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="proc-desc" style={{ marginTop: 6 }}>
                Clique em 🦷 para selecionar o dente no odontograma. Deixe sem
                seleção se o procedimento for geral.
              </div>
            </div>

            {/* Odontograma – renderizado via portal para sobrepor o modal pai */}
            {odoProcId !== null && createPortal(
              <OdontogramModal
                value={procedures.find((p) => p.id === odoProcId)?.tooth ?? ""}
                onSelect={(fdi) => setTooth(odoProcId, fdi)}
                onClose={() => setOdoProcId(null)}
              />,
              document.body
            )}

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações opcionais"
              />
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}