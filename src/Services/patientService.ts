import { API_URL, authHeaders } from "./api";

export interface PatientFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getPatients(token: string, filters: PatientFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.pageSize) params.append("page_size", String(filters.pageSize));
  if (filters.search) params.append("search", filters.search);

  return fetch(`${API_URL}/patients?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function getPatientById(token: string, id: number | string) {
  return fetch(`${API_URL}/patients/${id}`, {
    headers: authHeaders(token),
  });
}

export async function getPatientSummary(token: string, id: number | string) {
  return fetch(`${API_URL}/patients/${id}/summary`, {
    headers: authHeaders(token),
  });
}

export async function getPatientHistory(token: string, id: number | string) {
  return fetch(`${API_URL}/patients/${id}/history`, {
    headers: authHeaders(token),
  });
}

export async function createPatient(token: string, data: any) {
  return fetch(`${API_URL}/patients`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updatePatient(token: string, id: number | string, data: any) {
  return fetch(`${API_URL}/patients/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deletePatient(token: string, id: number | string) {
  return fetch(`${API_URL}/patients/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
