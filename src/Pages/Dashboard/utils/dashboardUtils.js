export const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function formatMonthLabel(year, month) {
  return `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`;
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

export function buildQueryParams(startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
