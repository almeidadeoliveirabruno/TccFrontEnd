export const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function formatMonthLabel(year, month) {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Recebe "2026-10-06" e separa manualmente para não sofrer com fuso horário
function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day, weekday: new Date(year, month - 1, day).getDay() };
}

// Eixo X: "06 Out"
export function formatDayLabel(iso) {
  const { month, day } = parseISODate(iso);
  return `${String(day).padStart(2, "0")} ${MONTH_LABELS[month - 1]}`;
}

// Tooltip: "Ter, 06/10/2026"
export function formatDayTooltip(iso) {
  const { year, month, day, weekday } = parseISODate(iso);
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${WEEKDAY_LABELS[weekday]}, ${dd}/${mm}/${year}`;
}

// Converte um item da API (por dia ou por mês) em rótulos para o gráfico
export function periodLabels(item) {
  if (item.date) {
    return { label: formatDayLabel(item.date), tooltipLabel: formatDayTooltip(item.date) };
  }
  const label = formatMonthLabel(item.year, item.month);
  return { label, tooltipLabel: label };
}

export function formatCurrency(value) {
  return `R$ ${Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;
}

export function formatCurrencyShort(value) {
  const n = Number(value ?? 0);
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1).replace(".0", "")}k`;
  return `R$ ${n.toFixed(0)}`;
}

// Mapeia o enum AppointmentStatus (backend, valores em minúsculo) para
// labels e cores usadas no dashboard
export const STATUS_META = {
  agendado: { label: "Agendado", color: "#3B82F6" },
  confirmado: { label: "Confirmado", color: "#22C55E" },
  realizado: { label: "Realizado", color: "#8B5CF6" },
  cancelado: { label: "Cancelado", color: "#F97316" },
  faltou: { label: "Faltou", color: "#EF4444" },
};

export function statusMeta(status) {
  const key = String(status).toLowerCase();
  return (
    STATUS_META[key] ?? {
      label: status,
      color: "#9CA3AF",
    }
  );
}

export function buildQueryParams(startDate, endDate, granularity) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  if (granularity) params.set("granularity", granularity);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
