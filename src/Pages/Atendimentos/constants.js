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

export const STATUS_COLORS = {
  agendado: { bg: "#E4F6F8", color: "#0a9db2" },
  confirmado: { bg: "#EAF3DE", color: "#3B6D11" },
  realizado: { bg: "#EEEDFE", color: "#534AB7" },
  cancelado: { bg: "#FEE2E2", color: "#B91C1C" },
  faltou: { bg: "#FAEEDA", color: "#854F0B" },
};

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
