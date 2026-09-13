import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../Services/auth";
import logo from "../../assets/Logo_Alternativa.png";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();

  function set(setter, field) {
          return (e) => {
              setter(e.target.value);
              setErrors((err) => ({ ...err, [field]: undefined }));
          };
      }
  


  const validateForm = () => {

    const e = {}

    if (!email) {
      e.email = "Email é obrigatório";
    }
    if (!password) {
      e.password = "Senha é obrigatória";
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return false;
    }
    setErrors({});
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
        localStorage.setItem("token", data.access_token);
        navigate("/home");
      } else {
        setErrors({ geral: "Credenciais inválidas" });
      }
    } catch {
      setLoading(false);
      setErrors({ geral: "Erro de conexão" });
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="login-left">
          <img src={logo} alt="Logo alternativa" className="login-logo" />

          <div className="brand-name">
            Odonto<span>Link</span>
          </div>
        </div>

        <div className="login-right">
          <h2>Login</h2>

          <p className="subtitle">Acesse sua conta para continuar</p>

          <div className="field-wrap">
            <p className="field-label">Email</p>

            <input
              className="login-input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (<span className="form-error">{errors.email}</span>)}
          </div>

          <div className="field-wrap">
            <p className="field-label">Senha</p>

            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
             {errors.password && (<span className="form-error">{errors.password}</span>)}
          </div>

          <div className="row-check">
            <label className="check-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Lembrar-me
            </label>

            <span className="forgot">Esqueci minha senha</span>
          </div>

          {errors.geral && <p className="error-msg">{errors.geral}</p>}

          <button
            className="btn-entrar"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="signup-row">
            Não tem uma conta?{" "}
            <span onClick={() => navigate("/signup")}>Cadastre-se</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
