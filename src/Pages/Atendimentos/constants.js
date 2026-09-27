import { APPOINTMENT_STATUS } from "../Agenda/constants";

export { APPOINTMENT_STATUS };

export const STATUS_OPTIONS = [
  "Agendado",
  "Confirmado",
  "Realizado",
  "Cancelado",
  "Faltou",
];

// label -> valor enviado/recebido da API (bate com models.appointment.AppointmentStatus)
export const STATUS_VALUE = {
  Agendado: "agendado",
  Confirmado: "confirmado",
  Realizado: "realizado",
  Cancelado: "cancelado",
  Faltou: "faltou",
};

export const STATUS_LABEL = Object.fromEntries(
  Object.entries(STATUS_VALUE).map(([label, value]) => [value, label]),
);

// Derivado diretamente de APPOINTMENT_STATUS para manter as mesmas cores da agenda
export const STATUS_COLORS = Object.fromEntries(
  Object.entries(APPOINTMENT_STATUS).map(([status, config]) => [
    status,
    {
      bg: config.badgeBg,
      color: config.badgeColor,
      badgeBg: config.badgeBg,
      badgeColor: config.badgeColor,
      accent: config.accent,
      cardBg: config.cardBg,
      cardBorder: config.cardBorder,
    },
  ]),
);

// Formulário do modal de criação/edição.
// procedures: [{ procedure_id, tooth, _name, _price }]  (_name/_price só pra exibição local)
export const EMPTY_FORM = {
  dentist_id: "",
  patient_id: "",
  appointment_date: "",
  time_begin: "",
  time_end: "",
  notes: "",
  procedures: [],
};
