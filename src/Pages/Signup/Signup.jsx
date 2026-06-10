import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signup } from "../../Services/auth";
import "./Signup.css";

function validarCNPJ(cnpj) {

    cnpj = cnpj.replace(/[^\d]+/g, "");

    if (cnpj.length !== 14)
        return false;

    if (/^(\d)\1+$/.test(cnpj))
        return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);

    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {

        soma += numeros[tamanho - i] * pos--;

        if (pos < 2)
            pos = 9;

    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

    if (resultado !== Number(digitos[0]))
        return false;

    tamanho++;
    numeros = cnpj.substring(0, tamanho);

    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {

        soma += numeros[tamanho - i] * pos--;

        if (pos < 2)
            pos = 9;

    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

    return resultado === Number(digitos[1]);

}

function Signup() {

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [nomeClinica, setNomeClinica] = useState("");
    const [cnpj, setCnpj] = useState("");

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const validateForm = () => {

        if (
            !nome ||
            !email ||
            !senha ||
            !confirmarSenha ||
            !nomeClinica ||
            !cnpj
        ) {

            setError("Preencha todos os campos.");
            return false;

        }

        if (senha.length < 8) {

            setError("A senha deve possuir pelo menos 8 caracteres.");
            return false;

        }

        if (senha !== confirmarSenha) {

            setError("As senhas não coincidem.");
            return false;

        }

        if (!validarCNPJ(cnpj)) {

            setError("CNPJ inválido.");
            return false;

        }

        setError("");

        return true;

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {

            const response = await signup(
                nome,
                email,
                senha,
                nomeClinica,
                cnpj
            );

            setLoading(false);

            if (response.ok) {

                navigate("/");

            } else {

                const error = await response.json();

                setError(
                    error.detail || "Erro ao criar conta."
                );

            }

        } catch {

            setLoading(false);

            setError("Erro de conexão");

        }

    };

    return (
        <div className="signup-page">

            <div className="signup-wrapper">

                <div className="signup-left">

                    <svg width="160" height="160" viewBox="0 0 140 140">
                        <path
                            d="M70 18 C45 18 28 36 30 58 C31 70 34 80 36 92 C38 104 40 118 48 118 C54 118 56 108 60 98 C62 92 65 88 70 88 C75 88 78 92 80 98 C84 108 86 118 92 118 C100 118 102 104 104 92 C106 80 109 70 110 58 C112 36 95 18 70 18 Z"
                            fill="none"
                            stroke="#1daa7a"
                            strokeWidth="7"
                        />
                    </svg>

                    <div className="brand-name">
                        Odonto<span>Link</span>
                    </div>

                </div>

                <div className="signup-right">

                    <h2>Criar conta</h2>

                    <p className="subtitle">
                        Cadastre sua clínica para começar
                    </p>

                    <div className="field-wrap">
                        <p className="field-label">Nome do usuário</p>

                        <input
                            className="signup-input"
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

                    <div className="field-wrap">
                        <p className="field-label">Email</p>

                        <input
                            className="signup-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="field-wrap">
                        <p className="field-label">Senha</p>

                        <div className="password-container">

                            <input
                                className="signup-input"
                                type={
                                    mostrarSenha
                                        ? "text"
                                        : "password"
                                }
                                value={senha}
                                onChange={(e) =>
                                    setSenha(e.target.value)
                                }
                            />

                            <button
                                type="button"
                                className="eye-button"
                                onClick={() =>
                                    setMostrarSenha(!mostrarSenha)
                                }
                            >
                                {
                                    mostrarSenha
                                        ? <FaEyeSlash />
                                        : <FaEye />
                                }
                            </button>

                        </div>

                    </div>

                    <div className="field-wrap">

                        <p className="field-label">
                            Confirmar senha
                        </p>

                        <div className="password-container">

                            <input
                                className="signup-input"
                                type={
                                    mostrarConfirmacao
                                        ? "text"
                                        : "password"
                                }
                                value={confirmarSenha}
                                onChange={(e) =>
                                    setConfirmarSenha(e.target.value)
                                }
                            />

                            <button
                                type="button"
                                className="eye-button"
                                onClick={() =>
                                    setMostrarConfirmacao(
                                        !mostrarConfirmacao
                                    )
                                }
                            >
                                {
                                    mostrarConfirmacao
                                        ? <FaEyeSlash />
                                        : <FaEye />
                                }
                            </button>

                        </div>

                    </div>

                    {
                        confirmarSenha &&
                        (
                            senha === confirmarSenha
                                ?
                                <p className="success-msg">
                                    ✓ As senhas coincidem
                                </p>
                                :
                                <p className="error-msg">
                                    As senhas não coincidem
                                </p>
                        )
                    }

                    <div className="clinic-row">

                        <div className="field-wrap clinic-field">

                            <p className="field-label">
                                Nome da clínica
                            </p>

                            <input
                                className="signup-input"
                                type="text"
                                value={nomeClinica}
                                onChange={(e) =>
                                    setNomeClinica(e.target.value)
                                }
                            />

                        </div>

                        <div className="field-wrap clinic-field">

                            <p className="field-label">
                                CNPJ
                            </p>

                            <input
                                className="signup-input"
                                type="text"
                                value={cnpj}
                                onChange={(e) => {

                                    let valor = e.target.value
                                        .replace(/\D/g, "")
                                        .replace(/^(\d{2})(\d)/, "$1.$2")
                                        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                                        .replace(/\.(\d{3})(\d)/, ".$1/$2")
                                        .replace(/(\d{4})(\d)/, "$1-$2")
                                        .slice(0, 18);

                                    setCnpj(valor);

                                }}
                            />

                        </div>

                    </div>

                    {error &&
                        <p className="error-msg">
                            {error}
                        </p>
                    }

                    <button
                        className="btn-register"
                        onClick={handleSubmit}
                        disabled={loading}
                    >

                        {
                            loading
                                ? "Criando conta..."
                                : "Criar conta"
                        }

                    </button>

                    <div className="login-row">
                        Já possui uma conta?
                        <span
                            onClick={() => navigate("/")}
                        >
                            Entrar
                        </span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Signup;