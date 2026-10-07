import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth.js";
import * as taskService from "../services/taskServices.js";

// Charge les tâches de l'utilisateur connecté et expose les actions CRUD.
// Un 401 (jeton expiré/invalide) déconnecte l'utilisateur.
export function useTasks() {
  const { token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) logout();
      throw err;
    },
    [logout],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await taskService.listTasks(token));
    } catch (err) {
      if (err.status === 401) logout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function createTask(task) {
    const created = await taskService.createTask(token, task).catch(handleError);
    setTasks((current) => [created, ...current]);
    return created;
  }

  async function updateTask(id, changes) {
    const updated = await taskService.updateTask(token, id, changes).catch(handleError);
    setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  async function deleteTask(id) {
    await taskService.deleteTask(token, id).catch(handleError);
    setTasks((current) => current.filter((t) => t.id !== id));
  }

  return { tasks, loading, error, reload, createTask, updateTask, deleteTask };
}
