import { useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { MAX_DAY_HOUR, MIN_DAY_HOUR } from "../constants";

const HOURS = Array.from(
  { length: MAX_DAY_HOUR - MIN_DAY_HOUR + 1 },
  (_, i) => MIN_DAY_HOUR + i,
);

function formatHour(h) {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function AgendaSettingsModal({ open, onClose, range, onSave }) {
  const [start, setStart] = useState(range.start);
  const [end, setEnd] = useState(range.end);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStart(range.start);
      setEnd(range.end);
      setError("");
    }
  }, [open, range.start, range.end]);

  if (!open) return null;

  function handleSave() {
    if (start >= end) {
      setError("O horário inicial precisa ser antes do horário final.");
      return;
    }
    if (end - start < 1) {
      setError("O intervalo precisa ter pelo menos 1 hora.");
      return;
    }
    onSave({ start, end });
    onClose();
  }

  return (
    <div className="agenda-settings-overlay" onClick={onClose}>
      <div
        className="agenda-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Configurações da agenda"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agenda-settings-header">
          <div className="agenda-settings-header-title">
            <Settings size={18} />
            <h3>Configurações da agenda</h3>
          </div>
          <button
            type="button"
            className="agenda-settings-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <p className="agenda-settings-desc">
          Defina o intervalo de horários exibido na grade da agenda.
        </p>

        <div className="agenda-settings-row">
          <label className="agenda-settings-field">
            <span>Início</span>
            <select value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>

          <label className="agenda-settings-field">
            <span>Fim</span>
            <select value={end} onChange={(e) => setEnd(Number(e.target.value))}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="agenda-settings-error">{error}</p>}

        <div className="agenda-settings-actions">
          <button type="button" className="agenda-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}