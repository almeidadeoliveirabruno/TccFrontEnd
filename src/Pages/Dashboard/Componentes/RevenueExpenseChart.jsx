import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./RevenueExpenseChart.css";
import { API_URL, authHeaders } from "../../../utils/api";
import { useAuth } from "../../../hooks/useAuth";
import {
  formatCurrency,
  formatCurrencyShort,
  formatMonthLabel,
  buildQueryParams,
} from "../utils/dashboardUtils";

function mergeRevenueExpense(revenue, expense) {
  const map = new Map();

  revenue.forEach((r) => {
    const key = `${r.year}-${r.month}`;
    map.set(key, {
      key,
      year: r.year,
      month: r.month,
      label: formatMonthLabel(r.year, r.month),
      receita: Number(r.total_revenue),
      despesa: 0,
    });
  });

  expense.forEach((e) => {
    const key = `${e.year}-${e.month}`;
    const existing = map.get(key);
    if (existing) {
      existing.despesa = Number(e.total_expense);
    } else {
      map.set(key, {
        key,
        year: e.year,
        month: e.month,
        label: formatMonthLabel(e.year, e.month),
        receita: 0,
        despesa: Number(e.total_expense),
      });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryParams(startDate, endDate);
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
  }, [token, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const lastRevenue = data[data.length - 1]?.receita ?? 0;
  const lastExpense = data[data.length - 1]?.despesa ?? 0;

  return (
    <div className="chart-card chart-card-wide">
      <div className="chart-card-header">
        <h3 className="chart-card-title">Receitas × Despesas</h3>
        <div className="chart-header-right">
          <div className="chart-legend-inline">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: "#3B82F6" }} />
              Receita · {formatCurrency(lastRevenue)}
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ background: "#EF4444" }} />
              Despesa · {formatCurrency(lastExpense)}
            </span>
          </div>

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
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3B82F6" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="despesa"
                name="Despesa"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#EF4444" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}