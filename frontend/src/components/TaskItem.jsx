import { useState } from "react";
import TaskForm from "./TaskForm.jsx";
import { PRIORITY_LABELS, STATUS_LABELS } from "../services/taskServices.js";
import { formatDateKey, todayKey } from "../utils/dates.js";
import { isOverdue } from "../utils/taskFilters.js";

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const overdue = isOverdue(task, todayKey());
  const priority = task.priority ?? "medium";

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

  function handleDelete() {
    if (!window.confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    run(() => onDelete(task.id));
  }

  if (editing) {
    return (
      <li className="task-item">
        <TaskForm
          initialTask={task}
          onSubmit={async (values) => {
            await onUpdate(task.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`task-item status-${task.status}`} aria-busy={busy}>
      <div className="task-main">
        <h3>
          <span className={`priority-badge priority-${priority}`}>
            <span className="visually-hidden">Priorité </span>
            {PRIORITY_LABELS[priority]}
          </span>
          {task.title}
        </h3>
        {task.description && <p className="task-description">{task.description}</p>}
        <p className="task-meta">
          {task.dueDate ? (
            <span className={overdue ? "overdue" : undefined}>
              Échéance : {formatDateKey(task.dueDate)}
              {overdue && " (en retard)"}
            </span>
          ) : (
            <span>Sans échéance</span>
          )}
        </p>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="task-actions">
        <label className="visually-hidden" htmlFor={`status-${task.id}`}>
          Statut de « {task.title} »
        </label>
        <select
          id={`status-${task.id}`}
          className={`status-select status-${task.status}`}
          value={task.status}
          disabled={busy}
          onChange={(e) => run(() => onUpdate(task.id, { status: e.target.value }))}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => setEditing(true)} aria-label={`Modifier « ${task.title} »`}>
          Modifier
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={busy}
          aria-label={`Supprimer « ${task.title} »`}
        >
          Supprimer
        </button>
      </div>
    </li>
  );
}
