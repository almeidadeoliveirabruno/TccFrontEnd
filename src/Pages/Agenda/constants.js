export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 19;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT_PX = 52;

export const APPOINTMENT_STATUS = {
  agendado: {
    label: "Agendado",
    badgeBg: "#f1f5f9",
    badgeColor: "#475569",
    accent: "#94a3b8",
  },
  confirmado: {
    label: "Confirmado",
    badgeBg: "#ecfdf5",
    badgeColor: "#047857",
    accent: "#10b981",
  },
  cancelado: {
    label: "Cancelado",
    badgeBg: "#fef2f2",
    badgeColor: "#b91c1c",
    accent: "#ef4444",
  },
  realizado: {
    label: "Realizado",
    badgeBg: "#eef2ff",
    badgeColor: "#4338ca",
    accent: "#6366f1",
  },
  faltou: {
    label: "Faltou",
    badgeBg: "#fffbeb",
    badgeColor: "#b45309",
    accent: "#f59e0b",
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
