import { useState, useEffect } from "react";
import "./Sidebar.css";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import logo from "../../../assets/Logo_Alternativa.png";
import { useAuth } from "../../../hooks/useAuth";
import ProfileModal from "./ProfileModal";
import Toast from "../../common/Toast/Toast";
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

function ToothIcon({ size = 24 }) {
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
  { to: "/home", label: "Home", Icon: House },
  { to: "/pacientes", label: "Pacientes", Icon: UserRound },
  { to: "/dentistas", label: "Dentistas", Icon: ToothIcon },
  { to: "/agenda", label: "Agenda", Icon: CalendarDays },
  { to: "/historico", label: "Histórico", Icon: FileText },
  { to: "/procedimentos", label: "Procedimentos", Icon: Pencil },
  { to: "/financeiro", label: "Financeiro", Icon: CircleDollarSign },
  { to: "/dashboard", label: "Relatórios", Icon: ChartColumn },
];

export default function Sidebar() {
  const { logout, token, saveToken } = useAuth();
  const payload = token ? jwtDecode<{ nome?: string }>(token) : null;
  const [displayName, setDisplayName] = useState<string>(payload?.nome ?? "Usuário");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (payload?.nome) {
      setDisplayName(payload.nome);
    }
  }, [payload?.nome]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  const handleProfileSaved = (
    userData: { id: number; email: string; nome: string; clinic: { id: string; nome: string; cnpj: string } },
    newToken: string
  ) => {
    if (newToken) {
      saveToken(newToken);
    }
    if (userData?.nome) {
      setDisplayName(userData.nome);
    }
    showToast("Dados atualizados com sucesso!", "success");
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={logo} alt="OdontoLink" />
        <div className="brand-name-sidebar">
          Odonto<span>Link</span>
        </div>
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
        <div
          className="profile-info"
          onClick={() => setIsProfileOpen(true)}
          role="button"
          tabIndex={0}
          title="Clique para editar informações"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsProfileOpen(true);
            }
          }}
        >
          <h4>{displayName}</h4>
        </div>


        <button className="logout-btn" onClick={logout} title="Encerrar sessão">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>

      <ProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSaved={handleProfileSaved}
        token={token}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </aside>
  );
}

