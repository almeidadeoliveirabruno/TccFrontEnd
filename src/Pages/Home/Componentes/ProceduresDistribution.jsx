import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { API_URL, authHeaders } from "../../../utils/api";

const COLORS = ["#0CB0C7", "#818CF8", "#34D399", "#FB923C", "#F472B6", "#9CA3AF"];

export default function ProceduresDistribution({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/home/procedure-distribution`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((json) => {
        if (active) setData(Array.isArray(json) ? json : []);
      })
      .catch(() => {
        if (active) setData([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <span className="dash-card-title">Procedimentos mais realizados</span>
      </div>

      {loading ? (
        <div className="table-loading">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum procedimento registrado ainda</p>
        </div>
      ) : (
        <div className="donut-wrap">
          <PieChart width={140} height={140}>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="category_name"
              innerRadius={45}
              outerRadius={68}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
          </PieChart>

          <ul className="donut-legend">
            {data.map((item, i) => (
              <li key={item.category_name}>
                <span
                  className="donut-dot"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="donut-legend-label">{item.category_name}</span>
                <span className="donut-legend-value">{item.percentage}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
