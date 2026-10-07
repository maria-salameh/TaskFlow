import { useState } from "react";
import TaskForm from "./TaskForm.jsx";
import { STATUS_LABELS } from "../services/taskServices.js";
import { formatDateKey, todayKey } from "../utils/dates.js";

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  const overdue = task.dueDate && task.status !== "done" && task.dueDate < todayKey();

  async function handleStatusChange(e) {
    setError(null);
    try {
      await onUpdate(task.id, { status: e.target.value });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    setError(null);
    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err.message);
    }
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
    <li className={`task-item status-${task.status}`}>
      <div className="task-main">
        <h3>{task.title}</h3>
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
        {error && <p className="inline-error" role="alert">{error}</p>}
      </div>

      <div className="task-actions">
        <label className="visually-hidden" htmlFor={`status-${task.id}`}>
          Statut de « {task.title} »
        </label>
        <select
          id={`status-${task.id}`}
          className={`status-select status-${task.status}`}
          value={task.status}
          onChange={handleStatusChange}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Supprimer
        </button>
      </div>
    </li>
  );
}
