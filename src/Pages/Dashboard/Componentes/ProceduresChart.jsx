import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, buildQueryParams } from "../utils/dashboardUtils";
import { API_URL, authHeaders } from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";

const METRICS = {
  count: {
    label: "Mais realizados",
    endpoint: "procedure-appointments-count",
    valueKey: "appointments_count",
    format: (v) => `${v}`,
  },
  billing: {
    label: "Valor gerado",
    endpoint: "procedure-billing-summary",
    valueKey: "total_billing",
    format: (v) => formatCurrency(v),
  },
};

const VISIBLE_COUNT = 5;
const MAX_LABEL_CHARS = 11;
const YAXIS_WIDTH = 110;

function truncate(name) {
  return name.length > MAX_LABEL_CHARS
    ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…`
    : name;
}

function YAxisTick({ x, y, payload }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#374151">
      <title>{payload.value}</title>
      {truncate(payload.value)}
    </text>
  );
}

function CustomTooltip({ active, payload, format }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{row.name}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-dot" style={{ background: "#3B82F6" }} />
        <strong>{format(row.value)}</strong>
      </div>
    </div>
  );
}

export default function ProceduresChart({ startDate, endDate }) {
  const { token } = useAuth();
  const [metric, setMetric] = useState("count");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate);
      const { endpoint, valueKey } = METRICS[metric];
      const r = await fetch(`${API_URL}/dashboard/${endpoint}${qs}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const raw = await r.json();
      setData(
        raw
          .map((item) => ({ name: item.name, value: Number(item[valueKey]) }))
          .sort((a, b) => b.value - a.value),
      );
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, metric]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setShowAll(false);
  }, [metric]);

  const format = METRICS[metric].format;
  const visibleData = showAll ? data : data.slice(0, VISIBLE_COUNT);
  const chartHeight = Math.max(visibleData.length * 42, 42);
  const hasMore = data.length > VISIBLE_COUNT;

  return (
    <div className="chart-card chart-card-half">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Procedimentos</h3>
        <select
          className="chart-select"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          {Object.entries(METRICS).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-loading">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="chart-empty">Sem dados no período selecionado</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={visibleData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                barCategoryGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={YAXIS_WIDTH}
                  tickLine={false}
                  axisLine={false}
                  tick={<YAxisTick />}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
                  content={<CustomTooltip format={format} />}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={16}>
                  {visibleData.map((entry) => (
                    <Cell key={entry.name} fill="#3B82F6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {hasMore && (
              <button
                type="button"
                className="chart-show-more"
                onClick={() => setShowAll((s) => !s)}
              >
                {showAll ? "Ver menos" : `Ver todos os procedimentos (${data.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

