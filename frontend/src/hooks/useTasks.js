import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth.js";
import * as taskService from "../services/taskServices.js";

// Charge les tâches de l'utilisateur connecté et expose les actions CRUD.
// `query` (facultatif) contient les filtres du bonus B1, envoyés à GET /api/tasks.
// Un 401 (jeton expiré ou invalide) déconnecte l'utilisateur.
export function useTasks(query) {
  const { token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Change à chaque modification : permet aux compteurs de se rafraîchir
  const [version, setVersion] = useState(0);

  // Les filtres sont comparés par valeur (un nouvel objet identique ne relance rien)
  const queryKey = JSON.stringify(query ?? {});

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) logout();
      throw err;
    },
    [logout],
  );

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        setTasks(await taskService.listTasks(token, JSON.parse(queryKey)));
      } catch (err) {
        if (err.status === 401) logout();
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, logout, queryKey],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  // Après une écriture, on recharge la liste depuis le serveur (sans écran de
  // chargement) : avec des filtres ou un tri actifs, c'est lui qui fait foi.
  async function afterWrite() {
    setVersion((v) => v + 1);
    await reload({ silent: true });
  }

  async function createTask(task) {
    const created = await taskService.createTask(token, task).catch(handleError);
    await afterWrite();
    return created;
  }

  async function updateTask(id, changes) {
    const updated = await taskService.updateTask(token, id, changes).catch(handleError);
    setTasks((current) => current.map((t) => (t.id === id ? updated : t)));
    await afterWrite();
    return updated;
  }

  async function deleteTask(id) {
    await taskService.deleteTask(token, id).catch(handleError);
    setTasks((current) => current.filter((t) => t.id !== id));
    await afterWrite();
  }

  return { tasks, loading, error, reload, version, createTask, updateTask, deleteTask };
}
