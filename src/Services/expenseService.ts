import { API_URL, authHeaders } from "./api";

export interface ExpenseFilterParams {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export async function getExpenseCategories(token: string) {
  return fetch(`${API_URL}/expenses/categories`, {
    headers: authHeaders(token),
  });
}

export async function getExpenses(token: string, filters: ExpenseFilterParams = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", String(filters.page));
  if (filters.pageSize) params.append("page_size", String(filters.pageSize));
  if (filters.status) params.append("status", filters.status);
  if (filters.category) params.append("category", filters.category);
  if (filters.dueDateFrom) params.append("due_date_from", filters.dueDateFrom);
  if (filters.dueDateTo) params.append("due_date_to", filters.dueDateTo);

  return fetch(`${API_URL}/expenses?${params.toString()}`, {
    headers: authHeaders(token),
  });
}

export async function createExpense(token: string, data: any) {
  return fetch(`${API_URL}/expenses`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateExpense(token: string, id: number | string, data: any) {
  return fetch(`${API_URL}/expenses/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function payExpense(token: string, id: number | string) {
  return fetch(`${API_URL}/expenses/${id}/pay`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function unpayExpense(token: string, id: number | string) {
  return fetch(`${API_URL}/expenses/${id}/unpay`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function deleteExpense(token: string, id: number | string) {
  return fetch(`${API_URL}/expenses/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
