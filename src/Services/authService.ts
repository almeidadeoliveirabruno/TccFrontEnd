import { API_URL } from "./api";

export async function login(email, password) {
    return fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });
}

export async function signup(
    nome,
    email,
    password,
    clinicName,
    clinicCnpj
) {
    const payload = {
        email,
        password,
        nome,
        clinic: {
            nome: clinicName,
            cnpj: clinicCnpj
        }
    };

    return fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

export async function getProfile(token: string) {
    return fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });
}

export async function updateProfile(
    token: string,
    data: { nome: string; nome_clinica: string; cnpj: string }
) {
    return fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
}