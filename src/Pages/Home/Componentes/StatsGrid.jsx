import { useState, useEffect } from "react";
import { API_URL, authHeaders } from "../../../utils/api";
import StatCard from "./StatCard";

export default function StatsGrid({ token }) {
  const [data, setData] = useState({
    patients: 0,
    appointments: 0,
    dentists: 0,
    expenses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [pRes, aRes, dRes, eRes] = await Promise.all([
          fetch(`${API_URL}/home/patients-count`, { headers: authHeaders(token) }),
          fetch(`${API_URL}/home/appointments-today`, { headers: authHeaders(token) }),
          fetch(`${API_URL}/home/dentist-count`, { headers: authHeaders(token) }),
          fetch(`${API_URL}/home/expenses-not-paid`, { headers: authHeaders(token) }),
        ]);
        const [p, a, d, e] = await Promise.all([
          pRes.json(),
          aRes.json(),
          dRes.json(),
          eRes.json(),
        ]);
        if (!active) return;
        setData({
          patients: p.patients_count ?? 0,
          appointments: a.appointments_count ?? 0,
          dentists: d.dentist_count ?? 0,
          expenses: e.expense_count ?? 0,
        });
      } catch {
        if (active) setData({ patients: 0, appointments: 0, dentists: 0, expenses: 0 });
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [token]);

  const show = (v) => (loading ? "—" : v);

  return (
    <div className="stats-grid">
      <StatCard
        icon="ti-users"
        iconBg="#E4F6F8"
        iconColor="#0a9db2"
        label="Pacientes cadastrados"
        value={show(data.patients)}
        sub="pacientes"
      />
      <StatCard
        icon="ti-calendar-check"
        iconBg="#DCFCE7"
        iconColor="#15803D"
        label="Consultas hoje"
        value={show(data.appointments)}
        sub="agendadas para hoje"
      />
      <StatCard
        icon="ti-stethoscope"
        iconBg="#EEEDFE"
        iconColor="#534AB7"
        label="Dentistas ativos"
        value={show(data.dentists)}
        sub="profissionais"
      />
      <StatCard
        icon="ti-cash"
        iconBg="#FEE2E2"
        iconColor="#B91C1C"
        label="Despesas em aberto"
        value={show(data.expenses)}
        sub="despesas pendentes"
      />
    </div>
  );
}
