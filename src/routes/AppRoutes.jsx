import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/signup";
import Procedimentos from "../Pages/Procedimentos/Procedimentos";
import Dentistas from "../Pages/Dentistas/Dentistas";
import PrivateRoute from "./PrivateRoute";

import AppLayout from "../layouts/AppLayout";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes >

        {/* Rotas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rotas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/procedimentos" element={<Procedimentos />} />
            <Route path="/dentistas" element={<Dentistas />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;