import TaskForm from "../components/TaskForm.jsx";
import TaskItem from "../components/TaskItem.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useTasks } from "../hooks/useTasks.js";

// Page d'accueil : création + liste des tâches de l'utilisateur connecté.
export default function Home() {
  const { tasks, loading, error, reload, createTask, updateTask, deleteTask } = useTasks();

  return (
    <section className="page home-page">
      <h1>Mes tâches</h1>

      <div className="home-grid">
        <div className="card">
          <TaskForm onSubmit={createTask} />
        </div>

        <div className="task-list-wrapper">
          <h2>
            Liste <span className="count">({tasks.length})</span>
          </h2>

          {loading && <p className="muted">Chargement…</p>}

          {!loading && error && (
            <div>
              <ErrorMessage message={error} />
              <button type="button" className="btn" onClick={reload}>Réessayer</button>
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <p className="empty">Aucune tâche pour l'instant. Ajoutez-en une avec le formulaire.</p>
          )}

          {!loading && !error && tasks.length > 0 && (
            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onUpdate={updateTask} onDelete={deleteTask} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
