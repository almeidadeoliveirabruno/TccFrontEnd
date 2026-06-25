import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function isTokenValid(token) {
  try {
    const { exp } = jwtDecode(token);
    // exp é em segundos, Date.now() em milissegundos
    return exp * 1000 > Date.now();
  } catch {
    return false; // token malformado
  }
}

function PrivateRoute() {
  const token = localStorage.getItem("token");

  return token && isTokenValid(token) ? <Outlet /> : <Navigate to="/" />;
}

export default PrivateRoute;