import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signup } from "../../Services/auth";
import logo from "../../assets/Logo_Alternativa.png";
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

   
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    function set(setter, field) {
        return (e) => {
            setter(e.target.value);
            setErrors((err) => ({ ...err, [field]: undefined }));
        };
    }

    const validateForm = () => {

        const e = {};

        if (!nome.trim()) e.nome = "Campo obrigatório";
        if (!email.trim()) e.email = "Campo obrigatório";
        if (!nomeClinica.trim()) e.nomeClinica = "Campo obrigatório";
        if (!cnpj) e.cnpj = "Campo obrigatório";

        if (!senha) {
            e.senha = "Campo obrigatório";
        } else if (senha.length < 8) {
            e.senha = "A senha deve possuir pelo menos 8 caracteres";
        }

        if (!confirmarSenha) {
            e.confirmarSenha = "Campo obrigatório";
        } else if (senha !== confirmarSenha) {
            e.confirmarSenha = "As senhas não coincidem";
        }

        if (cnpj && !validarCNPJ(cnpj)) {
            e.cnpj = "CNPJ inválido";
        }

        setErrors(e);
        return Object.keys(e).length === 0;

    };

    const handleSubmit = async (ev) => {

        ev.preventDefault();

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
                return;

            }

            const data = await response.json().catch(() => null);
            const detail = data?.detail ?? "";
            const lowerDetail = detail.toLowerCase();

            if (lowerDetail.includes("e-mail") || lowerDetail.includes("email")) {
                setErrors({ email: detail });
            } else if (lowerDetail.includes("cnpj")) {
                setErrors({ cnpj: detail });
            } else if (
                lowerDetail.includes("clínica") ||
                lowerDetail.includes("clinica")
            ) {
                setErrors({ nomeClinica: detail });
            } else if (lowerDetail.includes("senha")) {
                setErrors({ senha: detail });
            } else if (lowerDetail.includes("nome")) {
                setErrors({ nome: detail });
            } else {
                setErrors({ geral: detail || "Erro ao criar conta." });
            }

        } catch {

            setLoading(false);
            setErrors({ geral: "Erro de conexão" });

        }

    };

    return (
        <div className="signup-page">

            <div className="signup-wrapper">

                <div className="signup-left">

                    <img
                        src={logo}
                        alt="Logo alternativa"
                        className="signup-logo"
                    />

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
                        <p className="field-label">Nome</p>

                        <input
                            className={`signup-input ${errors.nome ? "input-error" : ""}`}
                            type="text"
                            value={nome}
                            onChange={set(setNome, "nome")}
                        />
                        {errors.nome && (
                            <span className="form-error">{errors.nome}</span>
                        )}
                    </div>

                    <div className="field-wrap">
                        <p className="field-label">Email</p>

                        <input
                            className={`signup-input ${errors.email ? "input-error" : ""}`}
                            type="email"
                            value={email}
                            onChange={set(setEmail, "email")}
                        />
                        {errors.email && (
                            <span className="form-error">{errors.email}</span>
                        )}
                    </div>

                    <div className="field-wrap">
                        <p className="field-label">Senha (8 caracteres)</p>

                        <div className="password-container">

                            <input
                                className={`signup-input ${errors.senha ? "input-error" : ""}`}
                                type={
                                    mostrarSenha
                                        ? "text"
                                        : "password"
                                }
                                value={senha}
                                onChange={set(setSenha, "senha")}
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
                        {errors.senha && (
                            <span className="form-error">{errors.senha}</span>
                        )}

                    </div>

                    <div className="field-wrap">

                        <p className="field-label">
                            Confirmar senha
                        </p>

                        <div className="password-container">

                            <input
                                className={`signup-input ${errors.confirmarSenha ? "input-error" : ""}`}
                                type={
                                    mostrarConfirmacao
                                        ? "text"
                                        : "password"
                                }
                                value={confirmarSenha}
                                onChange={set(setConfirmarSenha, "confirmarSenha")}
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

                        {
                            errors.confirmarSenha
                                ? <p className="error-msg">{errors.confirmarSenha}</p>
                                : confirmarSenha && senha === confirmarSenha && (
                                    <p className="success-msg">
                                        ✓ As senhas coincidem
                                    </p>
                                )
                        }

                    </div>

                    <div className="clinic-row">

                        <div className="field-wrap clinic-field">

                            <p className="field-label">
                                Nome da clínica
                            </p>

                            <input
                                className={`signup-input ${errors.nomeClinica ? "input-error" : ""}`}
                                type="text"
                                value={nomeClinica}
                                onChange={set(setNomeClinica, "nomeClinica")}
                            />
                            {errors.nomeClinica && (
                                <span className="form-error">{errors.nomeClinica}</span>
                            )}

                        </div>

                        <div className="field-wrap clinic-field">

                            <p className="field-label">
                                CNPJ
                            </p>

                            <input
                                className={`signup-input ${errors.cnpj ? "input-error" : ""}`}
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
                                    setErrors((err) => ({ ...err, cnpj: undefined }));

                                }}
                            />
                            {errors.cnpj && (
                                <span className="form-error">{errors.cnpj}</span>
                            )}

                        </div>

                    </div>

                    {errors.geral &&
                        <p className="error-msg">
                            {errors.geral}
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