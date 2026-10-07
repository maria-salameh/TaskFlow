import { STATUS_LABELS } from "../services/taskServices.js";

// Bonus B1 : compteur de tâches. `shown` = nombre affiché avec les filtres,
// `counts` = réponse de GET /api/tasks/count (toutes les tâches du compte).
export default function TaskCounter({ shown, counts, filtered }) {
  return (
    <div className="task-counter" aria-live="polite">
      <p className="counter-main">
        <strong>{shown}</strong> tâche{shown > 1 ? "s" : ""}
        {filtered && counts ? ` sur ${counts.total}` : ""}
      </p>
      {counts && (
        <ul className="counter-chips" aria-label="Répartition par statut">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <li key={status} className={`badge status-${status}`}>
              {label} : {counts.byStatus[status]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
