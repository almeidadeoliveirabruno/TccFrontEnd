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
import { API_URL, authHeaders } from "../../Services/api";
import { useAuth } from "../../hooks/useAuth";
import { periodLabels, buildQueryParams } from "../../Pages/Dashboard/utils/dashboardUtils";
import GranularityToggle from "./GranularityToggle";

// Acima disso os pontos ficam amontoados, então só mostramos a linha
const MAX_POINTS_WITH_DOTS = 31;

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{row.tooltipLabel}</div>
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
  const [granularity, setGranularity] = useState("month");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate, granularity);
      const r = await fetch(`${API_URL}/dashboard/appointments-count-by-period${qs}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const raw = await r.json();
      setData(
        raw.map((item) => ({
          ...periodLabels(item),
          count: item.count,
        })),
      );
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  const totalAtendimentos = data.reduce((sum, d) => sum + d.count, 0);
  const showDots = data.length <= MAX_POINTS_WITH_DOTS;

  return (
    <div className="chart-card chart-card-wide chart-card-attendance">
      <div className="chart-card-header">
        <h3 className="chart-card-title">
          Atendimentos por {granularity === "day" ? "dia" : "mês"}
        </h3>
        <div className="chart-header-right">
          <div className="chart-legend-inline">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: "#3B82F6" }} />
              Total do período · {totalAtendimentos}
            </span>
          </div>
          <GranularityToggle
            id="attendance-granularity"
            value={granularity}
            onChange={setGranularity}
          />
        </div>
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-loading">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="chart-empty">Sem dados no período selecionado</div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
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
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={40}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#atendimentosGradient)"
                dot={showDots ? { r: 4, fill: "#3B82F6" } : false}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}