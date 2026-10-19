import { API_URL, authHeaders } from "./api";

export interface DentistFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  specialty?: string;
  status?: string;
}

export async function getDentists(token: string, filters: DentistFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.pageSize) params.append("page_size", String(filters.pageSize));
  if (filters.search) params.append("search", filters.search);
  if (filters.specialty) params.append("specialty", filters.specialty);
  if (filters.status) params.append("status", filters.status);

  return fetch(`${API_URL}/dentists?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function getDentistById(token: string, id: number | string) {
  return fetch(`${API_URL}/dentists/${id}`, {
    headers: authHeaders(token),
  });
}

export async function getSpecialties(token: string) {
  return fetch(`${API_URL}/dentists/specialties`, {
    headers: authHeaders(token),
  });
}

export async function createSpecialty(token: string, name: string) {
  return fetch(`${API_URL}/dentists/specialties`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
}

export async function createDentist(token: string, data: any) {
  return fetch(`${API_URL}/dentists`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateDentist(token: string, id: number | string, data: any) {
  return fetch(`${API_URL}/dentists/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function getDentistSchedules(token: string, dentistId: number | string) {
  return fetch(`${API_URL}/dentists/${dentistId}/schedules`, {
    headers: authHeaders(token),
  });
}

export async function getDentistsBasic(token: string) {
  return fetch(`${API_URL}/dentists/basic`, {
    headers: authHeaders(token),
  });
}

export async function createDentistSchedule(token: string, dentistId: number | string, data: any) {
  return fetch(`${API_URL}/dentists/${dentistId}/schedules`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteDentistSchedule(token: string, dentistId: number | string, scheduleId: number | string) {
  return fetch(`${API_URL}/dentists/${dentistId}/schedules/${scheduleId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}



