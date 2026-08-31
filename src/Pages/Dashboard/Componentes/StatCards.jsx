import { useState, useEffect, useCallback } from "react";
import { API_URL, authHeaders } from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import { formatCurrency, buildQueryParams } from "../utils/dashboardUtils";

export default function StatCards({ startDate, endDate }) {
  const { token } = useAuth();
  const [profit, setProfit] = useState({
    total_revenue: 0,
    total_expense: 0,
    profit: 0,
  });
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate);
      const [profitRes, attendanceRes, appointmentsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/profit-cards${qs}`, {
          headers: authHeaders(token),
        }),
        fetch(`${API_URL}/dashboard/attendance-percentage${qs}`, {
          headers: authHeaders(token),
        }),
        fetch(`${API_URL}/dashboard/appointments-count${qs}`, {
          headers: authHeaders(token),
        }),
      ]);
      if (!profitRes.ok || !attendanceRes.ok || !appointmentsRes.ok) throw new Error();
      setProfit(await profitRes.json());
      const attendanceData = await attendanceRes.json();
      setAttendancePercentage(attendanceData.attendance_percentage);
      const appointmentsData = await appointmentsRes.json();
      setTotalAppointments(
        appointmentsData.reduce((sum, item) => sum + item.count, 0),
      );
    } catch {
      // mantém últimos valores carregados em caso de erro
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon" style={{ background: "#E4F6F8" }}>
            <i className="ti ti-currency-dollar" style={{ color: "#0a9db2" }} aria-hidden="true" />
          </div>
          <span className="stat-label">Faturamento</span>
        </div>
        <div className="stat-value stat-value-positive">
          {loading ? "..." : formatCurrency(profit.total_revenue)}
        </div>
        <div className="stat-sub">no período selecionado</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon" style={{ background: "#FDE8E8" }}>
            <i className="ti ti-wallet" style={{ color: "#C0392B" }} aria-hidden="true" />
          </div>
          <span className="stat-label">Despesas</span>
        </div>
        <div className="stat-value stat-value-negative">
          {loading ? "..." : formatCurrency(profit.total_expense)}
        </div>
        <div className="stat-sub">no período selecionado</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon" style={{ background: "#EAF3DE" }}>
            <i className="ti ti-chart-line" style={{ color: "#3B6D11" }} aria-hidden="true" />
          </div>
          <span className="stat-label">Lucro</span>
        </div>
        <div
          className={`stat-value ${profit.profit >= 0 ? "stat-value-positive" : "stat-value-negative"}`}
        >
          {loading ? "..." : formatCurrency(profit.profit)}
        </div>
        <div className="stat-sub">receita − despesas</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon" style={{ background: "#EEEDFE" }}>
            <i className="ti ti-calendar-check" style={{ color: "#534AB7" }} aria-hidden="true" />
          </div>
          <span className="stat-label">Atendimentos</span>
        </div>
        <div className="stat-value">{loading ? "..." : totalAppointments}</div>
        <div className="stat-sub">
          {loading ? "" : `${attendancePercentage.toFixed(1)}% de presença`}
        </div>
      </div>
    </div>
  );
}
