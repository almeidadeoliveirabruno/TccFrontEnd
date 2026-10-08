const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDays(anchorDate) {
  const start = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatWeekdayShort(date) {
  return WEEKDAY_SHORT[date.getDay()];
}

export function formatDayNumber(date) {
  return String(date.getDate());
}

export function formatMonthYear(date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function formatLongDate(iso) {
  return parseISODate(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Convenção de day_of_week usada pelo backend.
 * false (padrão) = mesma convenção do JS: 0=Domingo, 1=Segunda, ... 6=Sábado.
 * true  = convenção ISO/Python comum: 0=Segunda, 1=Terça, ... 6=Domingo.
 * Se o vermelho aparecer no dia errado da semana, troque este valor.
 */
export const BACKEND_WEEK_STARTS_ON_MONDAY = false;

/** Converte o dia retornado por Date.getDay() (0=Dom..6=Sáb) para a
 * convenção usada pelo backend, de acordo com a flag acima. */
export function toBackendDayOfWeek(jsDay) {
  if (!BACKEND_WEEK_STARTS_ON_MONDAY) return jsDay;
  return (jsDay + 6) % 7;
}

/**
 * A partir dos horários de expediente cadastrados (schedules) de um dentista,
 * retorna os intervalos (em minutos, dentro de [rangeStartMin, rangeEndMin])
 * em que ele NÃO atende no dia da semana informado (já convertido para a
 * convenção do backend via toBackendDayOfWeek). Se não houver nenhum
 * expediente cadastrado para o dia (seja porque o dentista não tem nenhum
 * horário cadastrado, seja porque esse dia específico não está configurado),
 * o dia inteiro é marcado como indisponível.
 */
export function computeUnavailableRanges(schedules, backendDayOfWeek, rangeStartMin, rangeEndMin) {
  const windows = (schedules ?? [])
    .filter((s) => s.day_of_week === backendDayOfWeek)
    .map((s) => [
      Math.max(timeToMinutes(s.time_begin), rangeStartMin),
      Math.min(timeToMinutes(s.time_end), rangeEndMin),
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  const merged = [];
  for (const [start, end] of windows) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  const gaps = [];
  let cursor = rangeStartMin;
  for (const [start, end] of merged) {
    if (start > cursor) gaps.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < rangeEndMin) gaps.push([cursor, rangeEndMin]);

  return gaps.map(([start, end]) => ({ start, end }));
}

export function formatTimeShort(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

export function minutesToTimeLabel(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function dentistInitials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function dentistColor(name, palette) {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}