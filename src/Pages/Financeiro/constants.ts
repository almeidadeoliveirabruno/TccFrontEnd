export const EXPENSE_CATEGORY_LABELS = {
  aluguel: "Aluguel",
  contas_fixas: "Contas fixas",
  material_odontologico: "Material odontológico",
  equipamento: "Equipamento",
  laboratorio: "Laboratório",
  salario: "Salário",
  pro_labore: "Pró-labore",
  marketing: "Marketing",
  software: "Software",
  contabilidade: "Contabilidade",
  impostos: "Impostos",
  limpeza: "Limpeza",
  manutencao: "Manutenção",
  outros: "Outros",
};

export function expenseCategoryLabel(value) {
  return EXPENSE_CATEGORY_LABELS[value] ?? value;
}

export const STATUS_LABELS = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  cancelado: "Cancelado",
};

export function financeStatusLabel(value) {
  return STATUS_LABELS[value] ?? value;
}

export const STATUS_COLORS = {
  pendente: { bg: "#FEF3C7", color: "#92400E" },
  parcial: { bg: "#DBEAFE", color: "#1E40AF" },
  pago: { bg: "#DCFCE7", color: "#15803D" },
  cancelado: { bg: "#FEE2E2", color: "#B91C1C" },
};