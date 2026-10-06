import "./GranularityToggle.css";

const OPTIONS = [
  { value: "month", label: "Mês" },
  { value: "day", label: "Dia" },
];

export default function GranularityToggle({ value, onChange, id }) {
  return (
    <div className="granularity-toggle" role="group" aria-label="Agrupar por" id={id}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          id={id ? `${id}-${opt.value}` : undefined}
          className={`granularity-toggle-btn${value === opt.value ? " active" : ""}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
