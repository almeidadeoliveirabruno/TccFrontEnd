export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}