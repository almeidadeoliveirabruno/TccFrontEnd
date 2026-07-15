import { useState, useEffect } from "react";
import { DAYS_OF_WEEK, EMPTY_SCHEDULE } from "../constants";
import { API_URL, authHeaders } from "../../../utils/api";

export default function DentistSchedules({
  dentistId,
  token,
  readOnly = false,
}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState(EMPTY_SCHEDULE);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/dentists/${dentistId}/schedules`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      setSchedules(await r.json());
    } catch {
      setError("Erro ao carregar horários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId]);

  async function handleAdd() {
    setError("");
    setAdding(true);
    try {
      const r = await fetch(`${API_URL}/dentists/${dentistId}/schedules`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ availability: [newItem] }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.detail || "Erro ao adicionar horário.");
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(scheduleId) {
    setError("");
    try {
      const r = await fetch(
        `${API_URL}/dentists/${dentistId}/schedules/${scheduleId}`,
        {
          method: "DELETE",
          headers: authHeaders(token),
        },
      );
      if (!r.ok) throw new Error();
      await load();
    } catch {
      setError("Erro ao remover horário.");
    }
  }

  const dayLabel = (v) => DAYS_OF_WEEK.find((d) => d.value === v)?.label ?? v;
  const fmt = (t) => (t ? t.slice(0, 5) : t);

  const dayAccent = {
    0: { border: "#E2E8F0", chip: "#F8FAFC", text: "#475569" },
    1: { border: "#DBEAFE", chip: "#EFF6FF", text: "#2563EB" },
    2: { border: "#DCFCE7", chip: "#F0FDF4", text: "#15803D" },
    3: { border: "#FDE68A", chip: "#FFFBEB", text: "#B45309" },
    4: { border: "#F5E7FF", chip: "#FAF5FF", text: "#7C3AED" },
    5: { border: "#FECACA", chip: "#FEF2F2", text: "#DC2626" },
    6: { border: "#E9D5FF", chip: "#F5F3FF", text: "#7E22CE" },
  };

  const groupedSchedules = schedules.reduce((acc, item) => {
    const key = item.day_of_week;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="schedule-manager">
      {loading ? (
        <p className="form-hint">Carregando horários...</p>
      ) : schedules.length === 0 ? (
        <p className="form-hint">Nenhum horário cadastrado ainda.</p>
      ) : (
        <ul className="schedule-list">
          {Object.entries(groupedSchedules).map(([day, items]) => {
            const accent = dayAccent[Number(day)] ?? dayAccent[0];
            return (
              <li
                key={day}
                className="schedule-row schedule-row-grouped"
                style={{ borderColor: accent.border, background: accent.chip }}
              >
                <div className="schedule-day-block">
                  <span
                    className="schedule-day-name"
                    style={{ color: accent.text }}
                  >
                    {dayLabel(Number(day))}
                  </span>
                  <div className="schedule-time-list">
                    {items.map((s) => (
                      <span
                        key={s.id}
                        className="schedule-time-chip"
                        style={{ background: accent.chip, color: accent.text }}
                      >
                        {fmt(s.time_begin)} às {fmt(s.time_end)}
                      </span>
                    ))}
                  </div>
                </div>
                {!readOnly && (
                  <div className="schedule-actions">
                    {items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="btn-icon del"
                        onClick={() => handleDelete(s.id)}
                        title="Remover horário"
                      >
                        🗑️
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="schedule-add-row">
          <select
            className="filter-select"
            value={newItem.day_of_week}
            onChange={(e) =>
              setNewItem((f) => ({ ...f, day_of_week: Number(e.target.value) }))
            }
          >
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            className="form-input"
            value={newItem.time_begin}
            onChange={(e) =>
              setNewItem((f) => ({ ...f, time_begin: e.target.value }))
            }
          />
          <span>às</span>
          <input
            type="time"
            className="form-input"
            value={newItem.time_end}
            onChange={(e) =>
              setNewItem((f) => ({ ...f, time_end: e.target.value }))
            }
          />
          <button
            type="button"
            className="btn-cancel"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Adicionando..." : "+ Adicionar"}
          </button>
        </div>
      )}

      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
