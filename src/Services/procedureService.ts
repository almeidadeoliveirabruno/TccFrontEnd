import { API_URL, authHeaders } from "./api";

export interface ProcedureFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}

export async function getProcedures(token: string, filters: ProcedureFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.pageSize) params.append("page_size", String(filters.pageSize));
  if (filters.search) params.append("search", filters.search);
  if (filters.category) params.append("category", filters.category);

  return fetch(`${API_URL}/procedures?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function createProcedure(token: string, data: any) {
  return fetch(`${API_URL}/procedures/`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateProcedure(token: string, id: number | string, data: any) {
  return fetch(`${API_URL}/procedures/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
