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

  const groupedSchedules = [...schedules]
    .sort(
      (a, b) =>
        a.day_of_week - b.day_of_week ||
        a.time_begin.localeCompare(b.time_begin),
    )
    .reduce((acc, schedule) => {
      const key = schedule.day_of_week;
      if (!acc[key]) acc[key] = [];
      acc[key].push(schedule);
      return acc;
    }, {});

  const groupedEntries = Object.entries(groupedSchedules)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, items]) => ({ day: Number(day), items }));

  return (
    <div className="schedule-manager">
      {loading ? (
        <p className="form-hint">Carregando horários...</p>
      ) : schedules.length === 0 ? (
        <p className="form-hint">Nenhum horário cadastrado ainda.</p>
      ) : (
        <ul className="schedule-list">
          {groupedEntries.map(({ day, items }) => (
            <li key={day} className="schedule-row schedule-row-grouped">
              <div className="schedule-day-block">
                <span className="schedule-day-name">{dayLabel(day)}</span>
                <div className="schedule-time-list">
                  {items.map((s) => (
                    <span key={s.id} className="schedule-time-chip">
                      {fmt(s.time_begin)} às {fmt(s.time_end)}
                      {!readOnly && (
                        <button
                          type="button"
                          className="btn-icon del"
                          onClick={() => handleDelete(s.id)}
                          title="Remover horário"
                        >
                          🗑️
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
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