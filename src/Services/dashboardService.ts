import { API_URL, authHeaders } from "./api";

export async function getHomePatientsCount(token: string) {
  return fetch(`${API_URL}/home/patients-count`, {
    headers: authHeaders(token),
  });
}

export async function getHomeAppointmentsToday(token: string) {
  return fetch(`${API_URL}/home/appointments-today`, {
    headers: authHeaders(token),
  });
}

export async function getHomeDentistCount(token: string) {
  return fetch(`${API_URL}/home/dentist-count`, {
    headers: authHeaders(token),
  });
}

export async function getHomeExpensesNotPaid(token: string) {
  return fetch(`${API_URL}/home/expenses-not-paid`, {
    headers: authHeaders(token),
  });
}

export async function getHomeNextAppointmentByDentist(token: string, dentistId: number | string) {
  return fetch(`${API_URL}/home/next-appointment-by-dentist?dentist_id=${dentistId}`, {
    headers: authHeaders(token),
  });
}

export async function getHomeProcedureDistribution(token: string) {
  return fetch(`${API_URL}/home/procedure-distribution`, {
    headers: authHeaders(token),
  });
}

export async function getHomeLastPatients(token: string) {
  return fetch(`${API_URL}/home/last-patients`, {
    headers: authHeaders(token),
  });
}

export async function getRevenueSummary(token: string, queryString: string = "") {
  return fetch(`${API_URL}/dashboard/revenue-summary${queryString}`, {
    headers: authHeaders(token),
  });
}

export async function getExpenseSummary(token: string, queryString: string = "") {
  return fetch(`${API_URL}/dashboard/expense-summary${queryString}`, {
    headers: authHeaders(token),
  });
}
