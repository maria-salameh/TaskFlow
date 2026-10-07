import ErrorMessage from "../components/ErrorMessage.jsx";
import HabitCard from "../components/HabitCard.jsx";
import HabitForm from "../components/HabitForm.jsx";
import { useHabits } from "../hooks/useHabits.js";
import { todayKey } from "../utils/dates.js";

// Bonus B2 : une habitude se répète (chaque jour ou chaque semaine) et garde un
// historique daté, contrairement à une tâche qu'on termine une seule fois.
export default function HabitsPage() {
  const { habits, logsByHabit, loading, error, reload, createHabit, updateHabit, deleteHabit, setDone } = useHabits();
  const today = todayKey();

  return (
    <section className="page habits-page">
      <h1>Mes habitudes</h1>
      <p className="page-intro muted">
        Cochez les jours (ou les semaines) où vous avez tenu votre habitude. Une habitude désactivée garde son
        historique mais ne peut plus être cochée.
      </p>

      <div className="card">
        <HabitForm onSubmit={createHabit} />
      </div>

      {loading && (
        <p className="muted" role="status">
          Chargement des habitudes…
        </p>
      )}
      {!loading && error && (
        <div>
          <ErrorMessage message={error} />
          <button type="button" className="btn" onClick={reload}>
            Réessayer
          </button>
        </div>
      )}
      {!loading && !error && habits.length === 0 && (
        <p className="empty">Aucune habitude pour l'instant. Ajoutez-en une ci-dessus.</p>
      )}
      {!loading && !error && habits.length > 0 && (
        <ul className="habit-list" aria-label="Liste des habitudes">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              dates={logsByHabit[habit.id] ?? []}
              today={today}
              onUpdate={updateHabit}
              onDelete={deleteHabit}
              onSetDone={setDone}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
