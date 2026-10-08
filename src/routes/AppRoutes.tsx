import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../Pages/Login/Login";
import Signup from "../Pages/Signup/Signup";
import Procedimentos from "../Pages/Procedimentos/Procedimentos";
import Dentistas from "../Pages/Dentistas/Dentistas";
import Agenda from "../Pages/Agenda/Agenda";
import ProtectedRoute from "../Components/layout/ProtectedRoute/ProtectedRoute";
import Pacientes from "../Pages/Pacientes/Pacientes";
import Financeiro from "../Pages/Financeiro/Financeiro";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Home from "../Pages/Home/Home";
import AppLayout from "../Components/layout/AppLayout/AppLayout";
import Atendimentos from "../Pages/Atendimentos/Atendimentos";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes >

        {/* Rotas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/procedimentos" element={<Procedimentos />} />
            <Route path="/dentistas" element={<Dentistas />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path= "/historico" element={<Atendimentos/>}/>
            <Route path = "/financeiro" element={<Financeiro/>}/>
            <Route path ='/dashboard' element = {<Dashboard/>}/>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;