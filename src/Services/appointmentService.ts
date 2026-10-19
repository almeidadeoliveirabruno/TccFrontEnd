import { API_URL, authHeaders } from "./api";

export interface AppointmentTableFilterParams {
  page?: number;
  pageSize?: number;
  patient?: string;
  dentist?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface AppointmentFilterParams {
  appointmentDate?: string;
  patientId?: number | string;
  dentistId?: number | string;
  status?: string;
}

export interface AvailableTimesParams {
  dentistId: number | string;
  appointmentDate: string;
  durationMinutes: number | string;
  excludeAppointmentId?: number | string;
}

export async function getAppointmentsTable(token: string, filters: AppointmentTableFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.pageSize) params.append("page_size", String(filters.pageSize));
  if (filters.patient) params.append("patient", filters.patient);
  if (filters.dentist) params.append("dentist", filters.dentist);
  if (filters.status) params.append("status", filters.status);
  if (filters.startDate) params.append("start_date", filters.startDate);
  if (filters.endDate) params.append("end_date", filters.endDate);

  return fetch(`${API_URL}/appointments/table?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function getAppointmentTableById(token: string, appointmentId: number | string) {
  return fetch(`${API_URL}/appointments/table/${appointmentId}`, {
    headers: authHeaders(token),
  });
}

export async function getAppointments(token: string, filters: AppointmentFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.appointmentDate) params.append("appointment_date", filters.appointmentDate);
  if (filters.patientId) params.append("patient_id", String(filters.patientId));
  if (filters.dentistId) params.append("dentist_id", String(filters.dentistId));
  if (filters.status) params.append("status", filters.status);

  return fetch(`${API_URL}/appointments?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function getAppointmentById(token: string, id: number | string) {
  return fetch(`${API_URL}/appointments/${id}`, {
    headers: authHeaders(token),
  });
}

export async function createAppointment(token: string, data: any) {
  return fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(token: string, id: number | string, data: any) {
  return fetch(`${API_URL}/appointments/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateAppointmentStatus(token: string, id: number | string, status: string) {
  return fetch(`${API_URL}/appointments/${id}/status`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export async function updateProcedureTooth(token: string, procedureItemId: number | string, tooth: string | null) {
  return fetch(`${API_URL}/appointments/procedures/${procedureItemId}/tooth`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tooth }),
  });
}

export async function updateAppointmentNotes(token: string, appointmentId: number | string, notes: string | null) {
  return fetch(`${API_URL}/appointments/${appointmentId}/notes`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });
}

export async function updateConfirmationMessage(token: string, id: number | string, sentState: boolean = true) {
  return fetch(`${API_URL}/appointments/${id}/confirmation-message?sent=${sentState}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export async function getAvailableTimes(token: string, params: AvailableTimesParams) {
  const query = new URLSearchParams({
    dentist_id: String(params.dentistId),
    appointment_date: params.appointmentDate,
    duration_minutes: String(params.durationMinutes),
    ...(params.excludeAppointmentId ? { exclude_appointment_id: String(params.excludeAppointmentId) } : {}),
  });

  return fetch(`${API_URL}/appointments/available-times?${query.toString()}`, {
    headers: authHeaders(token),
  });
}
