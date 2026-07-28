export const SPECIALTIES = [
  "Clínica Geral",
  "Ortodontia",
  "Endodontia",
  "Implantodontia",
  "Periodontia",
  "Odontopediatria",
  "Cirurgia Bucomaxilofacial",
  "Prótese Dentária",
];

export const SPECIALTY_COLORS = {
  "Clínica Geral":              { dot: "#0a9db2" },
  "Ortodontia":                 { dot: "#534AB7" },
  "Endodontia":                 { dot: "#993C1D" },
  "Implantodontia":             { dot: "#185FA5" },
  "Periodontia":                { dot: "#3B6D11" },
  "Odontopediatria":            { dot: "#854F0B" },
  "Cirurgia Bucomaxilofacial":  { dot: "#993556" },
  "Prótese Dentária":           { dot: "#5F5E5A" },
};

// Chaves batem com o enum DentistStatus do backend (models/dentist.py)
export const STATUS_OPTIONS = [
  { value: "Ativo", label: "Ativo" },
  { value: "Inativo", label: "Inativo" },
  { value: "Férias", label: "Férias" },
  { value: "Afastado", label: "Afastado" },
];

export const STATUS_COLORS = {
  Ativo:    { bg: "#DCFCE7", color: "#15803D" },
  Inativo:  { bg: "#FEE2E2", color: "#B91C1C" },
  Férias:   { bg: "#DBEAFE", color: "#1D4ED8" },
  Afastado: { bg: "#FEF3C7", color: "#92400E" },
};

export function statusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export const EMPTY_SCHEDULE = { day_of_week: 1, time_begin: "08:00", time_end: "12:00" };

export const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  cro: "",
  specialties: [],
  status: "ativo",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  cep: "",
};