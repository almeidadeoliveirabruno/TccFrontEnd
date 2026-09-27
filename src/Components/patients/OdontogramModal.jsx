import { useEffect, useRef } from "react";
import "./OdontogramModal.css";

/**
 * Odontograma interativo – notação FDI
 *
 * Dentição permanente: quadrantes 1-4  (dentes 11-18, 21-28, 31-38, 41-48)
 * Dentição decídua:    quadrantes 5-8  (dentes 51-55, 61-65, 71-75, 81-85)
 *
 * Props:
 *   value     – código FDI atualmente selecionado (string "11", "36", …) ou ""
 *   onSelect  – callback(fdiCode: string)
 *   onClose   – fecha o modal sem salvar
 */

// ── Estrutura dos quadrantes ─────────────────────────────────────────────────

const PERMANENT = [
  { quadrant: 1, teeth: [18, 17, 16, 15, 14, 13, 12, 11], label: "1" },
  { quadrant: 2, teeth: [21, 22, 23, 24, 25, 26, 27, 28], label: "2" },
  { quadrant: 4, teeth: [48, 47, 46, 45, 44, 43, 42, 41], label: "4" },
  { quadrant: 3, teeth: [31, 32, 33, 34, 35, 36, 37, 38], label: "3" },
];

const DECIDUOUS = [
  { quadrant: 5, teeth: [55, 54, 53, 52, 51], label: "5" },
  { quadrant: 6, teeth: [61, 62, 63, 64, 65], label: "6" },
  { quadrant: 8, teeth: [85, 84, 83, 82, 81], label: "8" },
  { quadrant: 7, teeth: [71, 72, 73, 74, 75], label: "7" },
];

function getToothClass(n) {
  const pos = n % 10;
  if (pos === 1 || pos === 2) return "tooth-incisor";
  if (pos === 3) return "tooth-canine";
  if (pos === 4 || pos === 5) return "tooth-premolar";
  return "tooth-molar";
}

function ToothIcon({ type }) {
  if (type === "tooth-incisor")
    return (
      <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="2" width="18" height="22" rx="9" fill="currentColor" opacity=".9" />
        <path d="M9 24 Q14 34 19 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (type === "tooth-canine")
    return (
      <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="11" rx="10" ry="10" fill="currentColor" opacity=".9" />
        <path d="M9 20 Q14 35 19 20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  if (type === "tooth-premolar")
    return (
      <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="2" width="20" height="18" rx="8" fill="currentColor" opacity=".9" />
        <path d="M8 20 Q11 32 14 20 Q17 32 20 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="26" height="18" rx="8" fill="currentColor" opacity=".9" />
      <path d="M7 20 Q10 32 13 20 Q16 32 19 20 Q22 32 25 20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Tooth({ number, selected, onClick }) {
  const cls = getToothClass(number);
  return (
    <button
      type="button"
      className={`odo-tooth ${cls} ${selected ? "odo-tooth--selected" : ""}`}
      title={`Dente ${number}`}
      onClick={() => onClick(String(number))}
      aria-pressed={selected}
    >
      <span className="odo-tooth-icon">
        <ToothIcon type={cls} />
      </span>
      <span className="odo-tooth-num">{number}</span>
    </button>
  );
}

function QuadrantRow({ quadrant, teeth, value, onSelect }) {
  return (
    <div className="odo-quadrant">
      <span className="odo-quadrant-label">Q{quadrant.label}</span>
      <div className="odo-teeth-row">
        {teeth.map((n) => (
          <Tooth
            key={n}
            number={n}
            selected={value === String(n)}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default function OdontogramModal({ value, onSelect, onClose }) {
  const overlayRef = useRef(null);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleSelect(fdi) {
    onSelect(fdi === value ? "" : fdi);
  }

  return (
    <div className="odo-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Odontograma">
      <div className="odo-modal">
        <div className="odo-modal-header">
          <div className="odo-modal-title">
            <span className="odo-modal-icon">🦷</span>
            Odontograma – Notação FDI
          </div>
          <button className="odo-close-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="odo-selected-banner">
          {value ? (
            <>
              <span className="odo-selected-label">Dente selecionado:</span>
              <span className="odo-selected-value">{value}</span>
              <button className="odo-clear-btn" onClick={() => onSelect("")}>Limpar</button>
            </>
          ) : (
            <span className="odo-selected-hint">Clique em um dente para selecioná-lo</span>
          )}
        </div>

        <div className="odo-section-label">Dentição Permanente</div>
        <div className="odo-jaw">
          <div className="odo-row odo-row-upper">
            <QuadrantRow quadrant={PERMANENT[0]} teeth={PERMANENT[0].teeth} value={value} onSelect={handleSelect} />
            <div className="odo-midline" />
            <QuadrantRow quadrant={PERMANENT[1]} teeth={PERMANENT[1].teeth} value={value} onSelect={handleSelect} />
          </div>
          <div className="odo-jaw-divider"><span>Superior ↑ ↓ Inferior</span></div>
          <div className="odo-row odo-row-lower">
            <QuadrantRow quadrant={PERMANENT[2]} teeth={PERMANENT[2].teeth} value={value} onSelect={handleSelect} />
            <div className="odo-midline" />
            <QuadrantRow quadrant={PERMANENT[3]} teeth={PERMANENT[3].teeth} value={value} onSelect={handleSelect} />
          </div>
        </div>

        <div className="odo-section-label odo-section-label--deciduous">Dentição Decídua (Leite)</div>
        <div className="odo-jaw odo-jaw--deciduous">
          <div className="odo-row odo-row-upper">
            <QuadrantRow quadrant={DECIDUOUS[0]} teeth={DECIDUOUS[0].teeth} value={value} onSelect={handleSelect} />
            <div className="odo-midline" />
            <QuadrantRow quadrant={DECIDUOUS[1]} teeth={DECIDUOUS[1].teeth} value={value} onSelect={handleSelect} />
          </div>
          <div className="odo-jaw-divider"><span>Superior ↑ ↓ Inferior</span></div>
          <div className="odo-row odo-row-lower">
            <QuadrantRow quadrant={DECIDUOUS[2]} teeth={DECIDUOUS[2].teeth} value={value} onSelect={handleSelect} />
            <div className="odo-midline" />
            <QuadrantRow quadrant={DECIDUOUS[3]} teeth={DECIDUOUS[3].teeth} value={value} onSelect={handleSelect} />
          </div>
        </div>

        <div className="odo-legend">
          <div className="odo-legend-item"><span className="odo-legend-dot odo-legend-dot--incisor" />Incisivo</div>
          <div className="odo-legend-item"><span className="odo-legend-dot odo-legend-dot--canine" />Canino</div>
          <div className="odo-legend-item"><span className="odo-legend-dot odo-legend-dot--premolar" />Pré-molar</div>
          <div className="odo-legend-item"><span className="odo-legend-dot odo-legend-dot--molar" />Molar</div>
        </div>

        <div className="odo-modal-footer">
          <button className="odo-btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            className="odo-btn-confirm"
            disabled={!value}
            onClick={() => { if (value) onClose(); }}
          >
            {value ? `Confirmar dente ${value}` : "Selecione um dente"}
          </button>
        </div>
      </div>
    </div>
  );
}
