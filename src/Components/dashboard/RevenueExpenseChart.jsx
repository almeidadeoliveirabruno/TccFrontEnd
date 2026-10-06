import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./RevenueExpenseChart.css";
import { API_URL, authHeaders } from "../../Services/api";
import { useAuth } from "../../hooks/useAuth";
import {
  formatCurrency,
  formatCurrencyShort,
  periodLabels,
  buildQueryParams,
} from "../../Pages/Dashboard/utils/dashboardUtils";
import GranularityToggle from "./GranularityToggle";

function periodKey(item) {
  return item.date ?? `${item.year}-${item.month}`;
}

// O backend já devolve os períodos em ordem e preenchidos com 0,
// então basta juntar receita e despesa pela mesma chave
function mergeRevenueExpense(revenue, expense) {
  const map = new Map();

  revenue.forEach((r) => {
    map.set(periodKey(r), {
      ...periodLabels(r),
      receita: Number(r.total_revenue),
      despesa: 0,
    });
  });

  expense.forEach((e) => {
    const key = periodKey(e);
    const existing = map.get(key);
    if (existing) {
      existing.despesa = Number(e.total_expense);
    } else {
      map.set(key, {
        ...periodLabels(e),
        receita: 0,
        despesa: Number(e.total_expense),
      });
    }
  });

  return Array.from(map.values());
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{payload[0].payload.tooltipLabel}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{formatCurrency(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function RevenueExpenseChart({ startDate, endDate, viewAllHref, viewAllLabel = "Ver dashboard" }) {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState("month");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate, granularity);
      const [revRes, expRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/revenue-summary${qs}`, {
          headers: authHeaders(token),
        }),
        fetch(`${API_URL}/dashboard/expense-summary${qs}`, {
          headers: authHeaders(token),
        }),
      ]);
      if (!revRes.ok || !expRes.ok) throw new Error();
      const revenue = await revRes.json();
      const expense = await expRes.json();
      setData(mergeRevenueExpense(revenue, expense));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  const lastRevenue = data[data.length - 1]?.receita ?? 0;
  const lastExpense = data[data.length - 1]?.despesa ?? 0;

  return (
    <div className="chart-card chart-card-full">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Receitas × Despesas</h3>
        <div className="chart-header-right">
          <div className="chart-legend-inline">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: "#22C55E" }} />
              Receita · {formatCurrency(lastRevenue)}
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: "#EF4444" }} />
              Despesa · {formatCurrency(lastExpense)}
            </span>
          </div>

          <GranularityToggle
            id="revenue-expense-granularity"
            value={granularity}
            onChange={setGranularity}
          />

          {viewAllHref && (
            <a className="chart-card-link" href={viewAllHref}>
              {viewAllLabel}
            </a>
          )}
        </div>
      </div>

      <div className="chart-body">
        {loading ? (
          <div className="chart-loading">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="chart-empty">Sem dados no período selecionado</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="receita"
                name="Receita"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="despesa"
                name="Despesa"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}