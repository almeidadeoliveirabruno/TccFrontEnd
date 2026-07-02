import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../Services/auth";
import "./Login.css";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);
   

    const navigate = useNavigate();

    const validateForm = () => {

        if (!email || !password) {
            setError("Email e senha são obrigatórios");
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
        const response = await login(email, password);

        setLoading(false);

        if (response.ok) {
            const data = await response.json();
            console.log(data.access_token);
            localStorage.setItem("token", data.access_token);
            console.log("Entrei aqui")
            navigate("/procedimentos");
        } else {
            setError("Credenciais inválidas");
        }

    } catch {
        setLoading(false);
        setError("Erro de conexão");
    }
};
    

    return (
        <div className="login-page">

            <div className="login-wrapper">

                <div className="login-left">

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

                <div className="login-right">

                    <h2>Login</h2>

                    <p className="subtitle">
                        Acesse sua conta para continuar
                    </p>

                    <div className="field-wrap">

                        <p className="field-label">
                            Email
                        </p>

                        <input
                            className="login-input"
                            type="text"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                        />

                    </div>

                    <div className="field-wrap">

                        <p className="field-label">
                            Senha
                        </p>

                        <input
                            className="login-input"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                        />

                    </div>

                    <div className="row-check">

                        <label className="check-label">

                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) =>
                                    setRemember(e.target.checked)
                                }
                            />

                            Lembrar-me

                        </label>

                        <span className="forgot">
                            Esqueci minha senha
                        </span>

                    </div>

                    {error &&
                        <p className="error-msg">
                            {error}
                        </p>
                    }

                    <button
                        className="btn-entrar"
                        onClick={handleSubmit}
                        disabled={loading}
                    >

                        {loading
                            ? "Entrando..."
                            : "Entrar"}

                    </button>

                    <div className="signup-row">
                        Não tem uma conta? <span onClick={() => navigate("/signup")}>Cadastre-se</span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;