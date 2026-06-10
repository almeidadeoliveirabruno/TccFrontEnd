export async function login(username, password) {
    // backend espera JSON com campos `email` e `password`
    const payload = {
        email: username,
        password: password
    };

    return fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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

    return fetch(
        "http://localhost:8000/auth/register",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );
}