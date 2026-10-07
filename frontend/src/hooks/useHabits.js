import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth.js";
import * as habitService from "../services/habitServices.js";
import { addDays, todayKey } from "../utils/dates.js";
import { groupLogsByHabit } from "../utils/habits.js";

// Bonus B2 : habitudes + réalisations de la dernière année (pour les séries)
export function useHabits() {
  const { token, logout } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logsByHabit, setLogsByHabit] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fail = useCallback(
    (err) => {
      if (err.status === 401) logout();
      throw err;
    },
    [logout],
  );

  const reload = useCallback(async () => {
    setError(null);
    try {
      const today = todayKey();
      const [habitList, logs] = await Promise.all([
        habitService.listHabits(token),
        habitService.listLogs(token, addDays(today, -370), addDays(today, 1)),
      ]);
      setHabits(habitList);
      setLogsByHabit(groupLogsByHabit(logs));
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

  async function createHabit(habit) {
    const created = await habitService.createHabit(token, habit).catch(fail);
    setHabits((list) => [created, ...list]);
  }

  async function updateHabit(id, changes) {
    const updated = await habitService.updateHabit(token, id, changes).catch(fail);
    setHabits((list) => list.map((h) => (h.id === id ? updated : h)));
  }

  async function deleteHabit(id) {
    await habitService.deleteHabit(token, id).catch(fail);
    setHabits((list) => list.filter((h) => h.id !== id));
  }

  async function setDone(habitId, date, done) {
    if (done) await habitService.markDone(token, habitId, date).catch(fail);
    else await habitService.unmarkDone(token, habitId, date).catch(fail);
    setLogsByHabit((map) => {
      const dates = (map[habitId] ?? []).filter((d) => d !== date);
      return { ...map, [habitId]: done ? [...dates, date].sort() : dates };
    });
  }

  return { habits, logsByHabit, loading, error, reload, createHabit, updateHabit, deleteHabit, setDone };
}
