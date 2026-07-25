export const GENDER_OPTIONS = [
  { value: "masculino", label: "Masculino", icon: "ti-gender-male" },
  { value: "feminino", label: "Feminino", icon: "ti-gender-female" },
  { value: "outro", label: "Outro", icon: "ti-user" },
];

export const EMPTY_PATIENT_FORM = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  birth_date: "",
  gender: "",
  health_plan: "",
  profession: "",
  observations: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  cep: "",
};

const AVATAR_PALETTE = [
  "#0CB0C7",
  "#818CF8",
  "#34D399",
  "#FB923C",
  "#F472B6",
  "#60A5FA",
];

export function avatarColor(name) {
  let hash = 0;
  for (const char of name ?? "") hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function initials(name) {
  const parts = (name ?? "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function genderLabel(value) {
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? "—";
}

export function genderIcon(value) {
  return GENDER_OPTIONS.find((g) => g.value === value)?.icon ?? "ti-user";
}

export function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birth = new Date(`${birthDateStr}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatBirthDateDisplay(birthDateStr) {
  if (!birthDateStr) return "—";
  const [y, m, d] = birthDateStr.split("-");
  if (!y || !m || !d) return birthDateStr;
  return `${d}/${m}/${y}`;
}

/* --------------------------------------------------------------------
 * Ainda não existe endpoint de agendamentos/histórico clínico no
 * backend (services/patient.py só cobre CRUD de cadastro). Os dados
 * abaixo são fixos, apenas para preencher a UI conforme o layout de
 * referência — quando a rota de consultas existir, basta substituir
 * getMockPatientTimeline por uma chamada de API equivalente.
 * -------------------------------------------------------------------- */

const MOCK_CONSULTA_TIPOS = [
  "Consulta de rotina",
  "Limpeza e profilaxia",
  "Avaliação inicial",
  "Retorno de acompanhamento",
  "Ajuste de aparelho",
  "Clareamento dental",
];

const MOCK_DENTISTAS = [
  "Dra. Mariana Silva",
  "Dr. Rafael Costa",
  "Dra. Beatriz Lima",
  "Dr. Eduardo Santos",
];

function seedFromId(id) {
  return String(id ?? 0)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDatePtBr(d) {
  return d.toLocaleDateString("pt-BR");
}

export function getMockPatientTimeline(patientId) {
  const seed = seedFromId(patientId);
  const today = new Date();

  const lastConsult = addDays(today, -(7 + (seed % 40)));
  const nextConsult = addDays(today, 3 + (seed % 20));
  const nextHour = 9 + (seed % 8);

  const history = [0, 1, 2].map((i) => {
    const d = addDays(lastConsult, -i * (12 + (seed % 15)));
    return {
      id: `${patientId}-${i}`,
      date: formatDatePtBr(d),
      title: MOCK_CONSULTA_TIPOS[(seed + i) % MOCK_CONSULTA_TIPOS.length],
      dentist: MOCK_DENTISTAS[(seed + i) % MOCK_DENTISTAS.length],
    };
  });

  return {
    lastConsult: {
      date: formatDatePtBr(lastConsult),
      title: MOCK_CONSULTA_TIPOS[seed % MOCK_CONSULTA_TIPOS.length],
      dentist: MOCK_DENTISTAS[seed % MOCK_DENTISTAS.length],
    },
    nextConsult: {
      date: formatDatePtBr(nextConsult),
      time: `${String(nextHour).padStart(2, "0")}:${seed % 2 === 0 ? "00" : "30"}`,
      dentist: MOCK_DENTISTAS[(seed + 1) % MOCK_DENTISTAS.length],
    },
    history,
  };
}