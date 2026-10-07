import TaskItem from "./TaskItem.jsx";
import ErrorMessage from "./ErrorMessage.jsx";

// Liste des tâches avec ses trois états : chargement, erreur, vide.
export default function TaskList({ tasks, loading, error, onRetry, onUpdate, onDelete, emptyMessage }) {
  if (loading) {
    return (
      <p className="muted" role="status">
        Chargement des tâches…
      </p>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage message={error} />
        {onRetry && (
          <button type="button" className="btn" onClick={() => onRetry()}>
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <p className="empty">{emptyMessage ?? "Aucune tâche pour l'instant."}</p>;
  }

  return (
    <ul className="task-list" aria-label="Liste des tâches">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  );
}
