import "./Sidebar.css";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import logo from "../../assets/odontolink-logo.svg";
import { useAuth } from "../../hooks/useAuth";
import {
  House,
  UserRound,
  CalendarDays,
  FileText,
  Pencil,
  CircleDollarSign,
  ChartColumn,
  LogOut,
} from "lucide-react";


function ToothIcon({size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 4C15 4 9 9.5 9 16.5C9 20.5 10.5 23.5 10.5 27C10.5 32 13 40 17 40C19 40 19.5 38 20 36C20.5 34 21 32 22 32C23 32 23.5 34 24 36C24.5 38 25 40 27 40C31 40 33.5 32 33.5 27C33.5 23.5 35 20.5 35 16.5C35 9.5 29 4 22 4Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const items = [
  { to: "/dashboard", label: "Home", Icon: House },
  { to: "/pacientes", label: "Pacientes", Icon: UserRound },
  { to: "/dentistas", label: "Dentistas", Icon: ToothIcon },
  { to: "/agenda", label: "Agenda", Icon: CalendarDays },
  { to: "/atendimentos", label: "Atendimentos", Icon: FileText },
  { to: "/procedimentos", label: "Procedimentos", Icon: Pencil },
  { to: "/financeiro", label: "Financeiro", Icon: CircleDollarSign },
  { to: "/relatorios", label: "Relatórios", Icon: ChartColumn },
];

export default function Sidebar() {
  const { setAuth, logout, token } = useAuth();
  const payload = token ? jwtDecode(token) : null;
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={logo} alt="OdontoLink" />
      </div>

      <nav className="menu">
        {items.map(({ to, label, Icon }) => (
          <a
            key={to}
            href={to}
            className={pathname === to ? "item active" : "item"}
          >
            <Icon size={24} />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="profile">
        <div className="profile-info">
          <h4>{payload.nome}</h4>
        </div>
        <button className="logout-btn">
          <LogOut size={20} />
          <span onClick={logout}>Sair</span>
        </button>
      </div>
    </aside>
  );
}