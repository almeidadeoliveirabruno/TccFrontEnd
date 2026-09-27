// Valores padrão usados até o usuário configurar um intervalo próprio em
// "Configurações da agenda". O intervalo escolhido é salvo no localStorage.
export const DEFAULT_DAY_START_HOUR = 8;
export const DEFAULT_DAY_END_HOUR = 19;
export const MIN_DAY_HOUR = 0;
export const MAX_DAY_HOUR = 23;
export const AGENDA_HOURS_STORAGE_KEY = "agenda:hours-range";

export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT_PX = 52;

export function loadAgendaHoursRange() {
  try {
    const raw = localStorage.getItem(AGENDA_HOURS_STORAGE_KEY);
    if (!raw) return { start: DEFAULT_DAY_START_HOUR, end: DEFAULT_DAY_END_HOUR };
    const parsed = JSON.parse(raw);
    const start = Number(parsed.start);
    const end = Number(parsed.end);
    if (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start >= MIN_DAY_HOUR &&
      end <= MAX_DAY_HOUR &&
      start < end
    ) {
      return { start, end };
    }
  } catch {
    // ignora e cai no padrão
  }
  return { start: DEFAULT_DAY_START_HOUR, end: DEFAULT_DAY_END_HOUR };
}

export function saveAgendaHoursRange(range) {
  localStorage.setItem(AGENDA_HOURS_STORAGE_KEY, JSON.stringify(range));
}

/** Última coluna (dentista) selecionada na agenda, para lembrar entre visitas. */
export const AGENDA_SELECTED_DENTIST_STORAGE_KEY = "agenda:selected-dentist";

export const APPOINTMENT_STATUS = {
  agendado: {
    label: "Agendado",
    badgeBg: "#f1f5f9",
    badgeColor: "#475569",
    accent: "#94a3b8",
    accentText: "#ffffff",
    cardBg: "rgba(241, 245, 249, 0.40)",
    cardBorder: "rgba(148, 163, 184, 0.18)",
  },
  confirmado: {
    label: "Confirmado",
    badgeBg: "#FEF3C7",
    badgeColor: "#78350f",
    accent: "#FEF3C7",
    accentText: "#78350f",
    cardBg: "rgba(254, 243, 199, 0.25)",
    cardBorder: "rgba(245, 158, 11, 0.18)",
  },
  cancelado: {
    label: "Cancelado",
    badgeBg: "#fef2f2",
    badgeColor: "#991b1b",
    accent: "#ef4444",
    accentText: "#ffffff",
    cardBg: "rgba(239, 68, 68, 0.05)",
    cardBorder: "rgba(239, 68, 68, 0.16)",
  },
  realizado: {
    label: "Realizado",
    badgeBg: "#f0fdf4",
    badgeColor: "#15803d",
    accent: "#22c55e",
    accentText: "#ffffff",
    cardBg: "rgba(34, 197, 94, 0.05)",
    cardBorder: "rgba(34, 197, 94, 0.16)",
  },
  faltou: {
    label: "Faltou",
    badgeBg: "#fef2f2",
    badgeColor: "#991b1b",
    accent: "#ef4444",
    accentText: "#ffffff",
    cardBg: "rgba(239, 68, 68, 0.05)",
    cardBorder: "rgba(239, 68, 68, 0.16)",
  },
};

/** Estado visual da confirmação via WhatsApp + resposta do paciente (status). */
export function getConfirmationUi(appointment) {
  const status = appointment?.status ?? "agendado";
  const sent = Boolean(appointment?.confirmation_message_sent);

  if (status === "confirmado") {
    return {
      key: "confirmed",
      label: "Confirmado pelo paciente",
      shortLabel: "Confirmado",
      tone: "success",
    };
  }
  if (status === "cancelado") {
    return {
      key: "canceled",
      label: "Cancelado pelo paciente",
      shortLabel: "Cancelado",
      tone: "danger",
    };
  }
  if (status === "realizado" || status === "faltou") {
    return {
      key: status,
      label: APPOINTMENT_STATUS[status]?.label ?? status,
      shortLabel: APPOINTMENT_STATUS[status]?.label ?? status,
      tone: "muted",
    };
  }
  if (sent) {
    return {
      key: "waiting",
      label: "Mensagem enviada · aguardando resposta",
      shortLabel: "Aguardando",
      tone: "warning",
    };
  }
  return {
    key: "pending",
    label: "Confirmação ainda não enviada",
    shortLabel: "Não enviado",
    tone: "neutral",
  };
}

export const DENTIST_COLUMN_COLORS = [
  "#0CB0C7",
  "#818CF8",
  "#34D399",
  "#FB923C",
  "#F472B6",
  "#60A5FA",
];