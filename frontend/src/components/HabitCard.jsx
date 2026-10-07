import { useState } from "react";
import HabitForm from "./HabitForm.jsx";
import { FREQUENCY_LABELS } from "../services/habitServices.js";
import { addDays, formatLongDateKey, parseDateKey } from "../utils/dates.js";
import { currentStreak, datesInWeek, isPeriodDone, lastDays, lastWeekStarts } from "../utils/habits.js";

function dayLabel(key) {
  const date = parseDateKey(key);
  return {
    short: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    day: date.getDate(),
  };
}

function weekLabel(weekStart) {
  return parseDateKey(weekStart).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function HabitCard({ habit, dates, today, onUpdate, onDelete, onSetDone }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const weekly = habit.frequency === "weekly";
  const streak = currentStreak(habit, dates, today);

  async function run(action) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Hebdomadaire : cocher une semaine enregistre le dernier jour écoulé de la semaine ;
  // la décocher supprime toutes ses réalisations.
  function toggleWeek(weekStart, done) {
    return run(async () => {
      if (done) {
        for (const date of datesInWeek(dates, weekStart)) await onSetDone(habit.id, date, false);
      } else {
        const weekEnd = addDays(weekStart, 6);
        await onSetDone(habit.id, weekEnd < today ? weekEnd : today, true);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Supprimer l'habitude « ${habit.title} » et tout son historique ?`)) return;
    run(() => onDelete(habit.id));
  }

  if (editing) {
    return (
      <li className="habit-card">
        <HabitForm
          initialHabit={habit}
          onSubmit={async (values) => {
            await onUpdate(habit.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const periods = weekly ? lastWeekStarts(today, 4) : lastDays(today, 7);

  return (
    <li className={`habit-card${habit.active ? "" : " inactive"}`} aria-busy={busy}>
      <div className="habit-head">
        <div>
          <h3>{habit.title}</h3>
          <p className="habit-meta">
            <span className="badge freq-badge">{FREQUENCY_LABELS[habit.frequency]}</span>
            {!habit.active && <span className="badge inactive-badge">Désactivée</span>}
            <span className="streak">
              Série : <strong>{streak}</strong> {weekly ? (streak > 1 ? "semaines" : "semaine") : streak > 1 ? "jours" : "jour"}
            </span>
          </p>
        </div>
        <div className="habit-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => run(() => onUpdate(habit.id, { active: !habit.active }))}>
            {habit.active ? "Désactiver" : "Réactiver"}
          </button>
          <button type="button" className="btn" onClick={() => setEditing(true)} aria-label={`Modifier « ${habit.title} »`}>
            Modifier
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={handleDelete} aria-label={`Supprimer « ${habit.title} »`}>
            Supprimer
          </button>
        </div>
      </div>

      <div className="habit-periods" role="group" aria-label={weekly ? "4 dernières semaines" : "7 derniers jours"}>
        {periods.map((period) => {
          const done = isPeriodDone(habit, dates, period);
          const isCurrent = weekly ? period === periods[periods.length - 1] : period === today;
          const label = weekly ? `Semaine du ${weekLabel(period)}` : formatLongDateKey(period);
          const { short, day } = dayLabel(period);
          return (
            <button
              key={period}
              type="button"
              className={`period${done ? " done" : ""}${isCurrent ? " current" : ""}`}
              aria-pressed={done}
              aria-label={`${label} : ${done ? "réalisée" : "non réalisée"}`}
              title={label}
              disabled={busy || !habit.active}
              onClick={() => (weekly ? toggleWeek(period, done) : run(() => onSetDone(habit.id, period, !done)))}
            >
              {weekly ? (
                <span className="period-week">{isCurrent ? "Cette sem." : weekLabel(period)}</span>
              ) : (
                <>
                  <span className="period-day">{short}</span>
                  <span className="period-num">{day}</span>
                </>
              )}
              <span className="period-check" aria-hidden="true">
                {done ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
