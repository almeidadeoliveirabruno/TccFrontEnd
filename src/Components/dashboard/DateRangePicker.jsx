export default function DateRangePicker({ startDate, endDate, onChange }) {
  return (
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
  );
}
