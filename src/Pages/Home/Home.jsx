import { useState, useEffect, useCallback } from "react";
import "./Home.css";
import { useAuth } from "../../hooks/useAuth";
import { API_URL, authHeaders } from "../../utils/api";
import UpcomingAppointments from "./Componentes/UpcomingAppointments";
import RevenueChartCard from "./Componentes/RevenueChartCard";
import ProceduresDistribution from "./Componentes/ProceduresDistribution";
import NewPatients from "./Componentes/NewPatients";

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Home() {
  const { token, user } = useAuth();

  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    dentists: 0,
    expenses: 0,
  });

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [pRes, aRes, dRes, eRes] = await Promise.all([
        fetch(`${API_URL}/home/patients-count`, { headers: authHeaders(token) }),
        fetch(`${API_URL}/home/appointments-today`, { headers: authHeaders(token) }),
        fetch(`${API_URL}/home/dentist-count`, { headers: authHeaders(token) }),
        fetch(`${API_URL}/home/expenses-not-paid`, { headers: authHeaders(token) }),
      ]);
      if (!pRes.ok || !aRes.ok || !dRes.ok || !eRes.ok) throw new Error();
      const [p, a, d, e] = await Promise.all([
        pRes.json(),
        aRes.json(),
        dRes.json(),
        eRes.json(),
      ]);
      setStats({
        patients: p.patients_count ?? 0,
        appointments: a.appointments_count ?? 0,
        dentists: d.dentist_count ?? 0,
        expenses: e.expense_count ?? 0,
      });
    } catch {
      setStats({ patients: 0, appointments: 0, dentists: 0, expenses: 0 });
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const show = (v) => (loadingStats ? "—" : v);

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <h1 className="home-title">Olá, {user?.name ?? "Doutor(a)"}! 👋</h1>
          <p className="home-subtitle">Aqui está o resumo da sua clínica hoje.</p>
        </div>
        <div className="home-date">
          <i className="ti ti-calendar" aria-hidden="true" />
          {todayLabel()}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#E4F6F8" }}>
              <i className="ti ti-users" style={{ color: "#0a9db2" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Pacientes cadastrados</span>
          </div>
          <div className="stat-value">{show(stats.patients)}</div>
          <div className="stat-sub">pacientes na clínica</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#DCFCE7" }}>
              <i
                className="ti ti-calendar-check"
                style={{ color: "#15803D" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Consultas hoje</span>
          </div>
          <div className="stat-value">{show(stats.appointments)}</div>
          <div className="stat-sub">agendadas para hoje</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#EEEDFE" }}>
              <i
                className="ti ti-stethoscope"
                style={{ color: "#534AB7" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Dentistas ativos</span>
          </div>
          <div className="stat-value">{show(stats.dentists)}</div>
          <div className="stat-sub">profissionais ativos</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#FEE2E2" }}>
              <i className="ti ti-cash" style={{ color: "#B91C1C" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Despesas em aberto</span>
          </div>
          <div className="stat-value">{show(stats.expenses)}</div>
          <div className="stat-sub">despesas pendentes</div>
        </div>
      </div>

      <div className="home-main-grid">
        <UpcomingAppointments token={token} dentistId={user?.dentist_id} />
        <RevenueChartCard />
      </div>

      <div className="home-bottom-grid">
        <ProceduresDistribution token={token} />
        <NewPatients token={token} />
      </div>
    </div>
  );
}