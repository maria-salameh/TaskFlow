import { useMemo, useState } from "react";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useTasks } from "../hooks/useTasks.js";
import { STATUS_LABELS } from "../services/taskServices.js";
import { toDateKey, todayKey, formatDateKey, formatLongDateKey } from "../utils/dates.js";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Construit les cases du mois (semaines du lundi au dimanche),
// en complétant avec les jours des mois voisins.
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const start = new Date(year, month, 1 - offset);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + lastDay) / 7);

  return Array.from({ length: weeks * 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { key: toDateKey(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
}

// Page calendrier : les tâches sont placées sur leur date d'échéance.
export default function CalendarPage() {
  const { tasks, loading, error, reload } = useTasks();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(todayKey);

  const days = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const tasksByDay = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      if (!task.dueDate) continue;
      (map[task.dueDate] ??= []).push(task);
    }
    return map;
  }, [tasks]);

  const undated = tasks.filter((t) => !t.dueDate);
  const today = todayKey();
  const selectedTasks = tasksByDay[selectedDay] ?? [];

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  function moveMonth(delta) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDay(today);
  }

  return (
    <section className="page calendar-page">
      <div className="calendar-toolbar">
        <h1 className="calendar-title">{monthLabel}</h1>
        <div className="calendar-nav">
          <button type="button" className="btn" onClick={() => moveMonth(-1)} aria-label="Mois précédent">‹</button>
          <button type="button" className="btn" onClick={goToday}>Aujourd'hui</button>
          <button type="button" className="btn" onClick={() => moveMonth(1)} aria-label="Mois suivant">›</button>
        </div>
      </div>

      {loading && <p className="muted">Chargement…</p>}
      {!loading && error && (
        <div>
          <ErrorMessage message={error} />
          <button type="button" className="btn" onClick={reload}>Réessayer</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="calendar-grid" role="grid" aria-label={`Calendrier ${monthLabel}`}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="calendar-weekday" role="columnheader">{d}</div>
            ))}
            {days.map(({ key, day, inMonth }) => {
              const dayTasks = tasksByDay[key] ?? [];
              const classes = [
                "calendar-day",
                !inMonth && "outside",
                key === today && "today",
                key === selectedDay && "selected",
              ].filter(Boolean).join(" ");
              return (
                <button
                  type="button"
                  key={key}
                  className={classes}
                  onClick={() => setSelectedDay(key)}
                  aria-label={`${formatDateKey(key)}, ${dayTasks.length} tâche(s)`}
                  aria-pressed={key === selectedDay}
                >
                  <span className="day-number">{day}</span>
                  <span className="day-events">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span key={t.id} className={`event status-${t.status}`}>{t.title}</span>
                    ))}
                    {dayTasks.length > 3 && <span className="event-more">+{dayTasks.length - 3}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <span key={value} className="legend-item">
                <span className={`legend-dot status-${value}`} /> {label}
              </span>
            ))}
          </div>

          <div className="calendar-details">
            <div className="card">
              <h2>{formatLongDateKey(selectedDay)}</h2>
              {selectedTasks.length === 0 ? (
                <p className="muted">Aucune tâche à cette date.</p>
              ) : (
                <ul className="day-task-list">
                  {selectedTasks.map((t) => (
                    <li key={t.id}>
                      <span className={`badge status-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                      <strong>{t.title}</strong>
                      {t.description && <p className="task-description">{t.description}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h2>Sans échéance ({undated.length})</h2>
              {undated.length === 0 ? (
                <p className="muted">Toutes les tâches ont une date.</p>
              ) : (
                <ul className="day-task-list">
                  {undated.map((t) => (
                    <li key={t.id}>
                      <span className={`badge status-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                      <strong>{t.title}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
