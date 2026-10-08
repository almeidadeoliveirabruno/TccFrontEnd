import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const navigate = useNavigate();

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  function saveToken(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/", { replace: true });
  }

  return {
    token,
    saveToken,
    logout,
  };
}