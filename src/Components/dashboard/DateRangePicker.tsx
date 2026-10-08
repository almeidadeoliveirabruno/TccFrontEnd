export function getPresetRange(months: number) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  start.setDate(1);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: toISO(start), endDate: toISO(end) };
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const PRESETS = [
    { label: "1 mês", months: 1 },
    { label: "3 meses", months: 3 },
    { label: "6 meses", months: 6 },
  ];

  const handlePresetClick = (months: number) => {
    onChange(getPresetRange(months));
  };

  return (
    <div className="date-range-container">
      <div className="date-range-picker">
        <i className="ti ti-calendar" aria-hidden="true" />
        <input
          type="date"
          className="date-input"
          value={startDate}
          onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        />
        <span className="date-sep">–</span>
        <input
          type="date"
          className="date-input"
          value={endDate}
          onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        />
      </div>
      <div className="date-presets" role="group" aria-label="Atalhos de período">
        {PRESETS.map((preset) => {
          const range = getPresetRange(preset.months);
          const isActive =
            startDate === range.startDate && endDate === range.endDate;

          return (
            <button
              key={preset.months}
              type="button"
              className={`preset-btn${isActive ? " active" : ""}`}
              onClick={() => handlePresetClick(preset.months)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

