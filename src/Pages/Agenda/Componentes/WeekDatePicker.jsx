import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  formatDayNumber,
  formatMonthYear,
  formatWeekdayShort,
  getWeekDays,
  isSameDay,
  toISODate,
} from "../utils";

export default function WeekDatePicker({ selectedDate, onChangeDate }) {
  const weekDays = getWeekDays(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function shiftWeek(delta) {
    onChangeDate(addDays(selectedDate, delta * 7));
  }

  return (
    <div className="agenda-date-picker">
      <div className="agenda-date-picker-top">
        <div>
          <p className="agenda-date-picker-label">Período</p>
          <h2 className="agenda-date-picker-month">{formatMonthYear(selectedDate)}</h2>
        </div>
        <div className="agenda-date-picker-actions">
          <button
            type="button"
            className="agenda-date-nav"
            onClick={() => shiftWeek(-1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="agenda-date-today"
            onClick={() => onChangeDate(new Date())}
          >
            Hoje
          </button>
          <button
            type="button"
            className="agenda-date-nav"
            onClick={() => shiftWeek(1)}
            aria-label="Próxima semana"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="agenda-date-strip" role="tablist" aria-label="Dias da semana">
        {weekDays.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={toISODate(day)}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`agenda-date-chip ${selected ? "selected" : ""} ${isToday ? "today" : ""}`}
              onClick={() => onChangeDate(day)}
            >
              <span className="agenda-date-chip-weekday">{formatWeekdayShort(day)}</span>
              <span className="agenda-date-chip-day">{formatDayNumber(day)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
