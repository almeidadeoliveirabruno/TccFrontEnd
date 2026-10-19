import { API_URL, authHeaders } from "./api";

export interface ReceivableFilterParams {
  page?: number;
  pageSize?: number;
  status?: string;
  patientName?: string;
  dentistName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getReceivables(token: string, filters: ReceivableFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.pageSize) params.append("page_size", String(filters.pageSize));
  if (filters.status) params.append("status", filters.status);
  if (filters.patientName) params.append("patient_name", filters.patientName);
  if (filters.dentistName) params.append("dentist_name", filters.dentistName);
  if (filters.dateFrom) params.append("date_from", filters.dateFrom);
  if (filters.dateTo) params.append("date_to", filters.dateTo);

  return fetch(`${API_URL}/receivables?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function getReceivableByAppointment(token: string, appointmentId: number | string) {
  return fetch(`${API_URL}/receivables/by-appointment/${appointmentId}`, {
    headers: authHeaders(token),
  });
}

export async function payReceivable(
  token: string,
  id: number | string,
  params: { paymentMethod: string; paidAt: string }
) {
  const query = new URLSearchParams({
    payment_method: params.paymentMethod,
    paid_at: params.paidAt,
  });
  return fetch(`${API_URL}/receivables/${id}/pay?${query.toString()}`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function updateReceivable(
  token: string,
  id: number | string,
  data: { payment_method: string; paid_at: string }
) {
  return fetch(`${API_URL}/receivables/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function unpayReceivable(token: string, id: number | string) {
  return fetch(`${API_URL}/receivables/${id}/unpay`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function cancelReceivable(token: string, id: number | string) {
  return fetch(`${API_URL}/receivables/${id}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function reactivateReceivable(token: string, id: number | string) {
  return fetch(`${API_URL}/receivables/${id}/reactivate`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

