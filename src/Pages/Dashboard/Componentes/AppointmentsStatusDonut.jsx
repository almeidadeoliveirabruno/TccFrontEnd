import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { API_URL, authHeaders } from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import { statusMeta, buildQueryParams } from "../utils/dashboardUtils";

export default function AppointmentsStatusDonut({ startDate, endDate }) {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate);
      const r = await fetch(`${API_URL}/dashboard/appointments-count${qs}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const raw = await r.json();
      setData(
        raw
          .map((item) => ({
            ...item,
            ...statusMeta(item.status),
          }))
          .sort((a, b) => b.count - a.count),
      );
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card chart-card-narrow">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Agendamentos por status</h3>
      </div>

      <div className="chart-body donut-body">
        {loading ? (
          <div className="chart-loading">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="chart-empty">Sem dados no período selecionado</div>
        ) : (
          <>
            <div className="donut-wrap">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <div className="donut-center-value">{total}</div>
                <div className="donut-center-label">Total</div>
              </div>
            </div>

            <ul className="donut-legend">
              {data.map((d) => (
                <li key={d.status} className="donut-legend-item">
                  <span className="legend-dot" style={{ background: d.color }} />
                  <span className="donut-legend-name">{d.label}</span>
                  <span className="donut-legend-pct">{d.percentage}%</span>
                  <span className="donut-legend-count">{d.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
