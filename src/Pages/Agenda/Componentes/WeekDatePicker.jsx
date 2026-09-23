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

// soma/subtrai meses sem estourar o fim do mês (ex.: 31/01 + 1 mês = 28/02, não 03/03)
function shiftMonth(date, delta) {
  const year = date.getFullYear();
  const month = date.getMonth() + delta;
  // último dia do mês de destino (dia 0 do mês seguinte)
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay));
}

export default function WeekDatePicker({ selectedDate, onChangeDate }) {
  const weekDays = getWeekDays(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function shiftWeek(delta) {
    onChangeDate(addDays(selectedDate, delta * 7));
  }

  function changeMonth(delta) {
    onChangeDate(shiftMonth(selectedDate, delta));
  }

  return (
    <div className="agenda-date-picker">
      <div className="agenda-date-picker-top">
        <div>
          <p className="agenda-date-picker-label">Período</p>
          <div className="agenda-date-month-nav">
            <button
              type="button"
              className="agenda-date-nav"
              onClick={() => changeMonth(-1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="agenda-date-picker-month">{formatMonthYear(selectedDate)}</h2>
            <button
              type="button"
              className="agenda-date-nav"
              onClick={() => changeMonth(1)}
              aria-label="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
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