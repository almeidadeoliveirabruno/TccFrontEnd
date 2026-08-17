import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/signup";
import Procedimentos from "../Pages/Procedimentos/Procedimentos";
import Dentistas from "../Pages/Dentistas/Dentistas";
import Agenda from "../Pages/Agenda/Agenda";
import PrivateRoute from "./PrivateRoute";
import Pacientes from "../Pages/Pacientes/pacientes";
import Financeiro from "../Pages/Financeiro/Financeiro";
import Lancamentos from "../Pages/Financeiro/Lancamentos";

import AppLayout from "../layouts/AppLayout";
import Atendimentos from "../Pages/Atendimentos/Atendimentos";

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
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path= "/historico" element={<Atendimentos/>}/>
            <Route path = "/financeiro" element={<Financeiro/>}/>
            <Route path="/financeiro/lancamentos" element={<Lancamentos />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;