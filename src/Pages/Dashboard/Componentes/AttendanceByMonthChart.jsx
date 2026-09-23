import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_URL, authHeaders } from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import { formatMonthLabel, buildQueryParams } from "../utils/dashboardUtils";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-dot" style={{ background: "#3B82F6" }} />
        <span>Atendimentos</span>
        <strong>{row.count}</strong>
      </div>
    </div>
  );
}

export default function AppointmentsCountByMonthChart({ startDate, endDate }) {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate);
      const r = await fetch(`${API_URL}/dashboard/appointments-count-by-period${qs}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const raw = await r.json();
      setData(
        raw.map((item) => ({
          label: formatMonthLabel(item.year, item.month),
          count: item.count,
        })),
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

  const totalAtendimentos = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="chart-card chart-card-full">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Atendimentos por mês</h3>
        <div className="chart-legend-inline">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#3B82F6" }} />
            Total do período · {totalAtendimentos}
          </span>
        </div>
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-loading">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="chart-empty">Sem dados no período selecionado</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="atendimentosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#atendimentosGradient)"
                dot={{ r: 4, fill: "#3B82F6" }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}