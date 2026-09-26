import { API_URL } from "../utils/api";

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