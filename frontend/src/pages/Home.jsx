import { useState } from "react";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import TaskFilters from "../components/TaskFilters.jsx";
import TaskCounter from "../components/TaskCounter.jsx";
import { useTasks } from "../hooks/useTasks.js";
import { useTaskCounts } from "../hooks/useTaskCounts.js";
import { todayKey } from "../utils/dates.js";
import { DEFAULT_FILTERS, buildTaskQuery, hasActiveFilters } from "../utils/taskFilters.js";

// Page d'accueil : création + liste filtrable des tâches de l'utilisateur connecté.
export default function Home() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const filtered = hasActiveFilters(filters);
  const { tasks, loading, error, reload, version, createTask, updateTask, deleteTask } = useTasks(
    buildTaskQuery(filters, todayKey()),
  );
  const counts = useTaskCounts(version);

  return (
    <section className="page home-page">
      <h1>Mes tâches</h1>

      <div className="home-grid">
        <div className="card">
          <TaskForm onSubmit={createTask} />
        </div>

        <div className="task-list-wrapper">
          <TaskFilters value={filters} onChange={setFilters} />
          <TaskCounter shown={tasks.length} counts={counts} filtered={filtered} />
          <TaskList
            tasks={tasks}
            loading={loading}
            error={error}
            onRetry={reload}
            onUpdate={updateTask}
            onDelete={deleteTask}
            emptyMessage={
              filtered
                ? "Aucune tâche ne correspond à ces filtres."
                : "Aucune tâche pour l'instant. Ajoutez-en une avec le formulaire."
            }
          />
        </div>
      </div>
    </section>
  );
}
