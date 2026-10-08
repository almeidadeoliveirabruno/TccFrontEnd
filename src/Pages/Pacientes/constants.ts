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