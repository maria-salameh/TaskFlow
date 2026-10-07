import { apiRequest } from "./api.js";

// Bonus B2 : habitudes et réalisations datées

export async function listHabits(token) {
  return (await apiRequest("/api/habits", { token })).items;
}

export function createHabit(token, habit) {
  return apiRequest("/api/habits", { method: "POST", body: habit, token });
}

export function updateHabit(token, id, changes) {
  return apiRequest(`/api/habits/${id}`, { method: "PATCH", body: changes, token });
}

export function deleteHabit(token, id) {
  return apiRequest(`/api/habits/${id}`, { method: "DELETE", token });
}

export async function listLogs(token, from, to) {
  return (await apiRequest("/api/habit-logs", { token, query: { from, to } })).items;
}

export function markDone(token, habitId, date) {
  return apiRequest(`/api/habits/${habitId}/logs/${date}`, { method: "PUT", token });
}

export function unmarkDone(token, habitId, date) {
  return apiRequest(`/api/habits/${habitId}/logs/${date}`, { method: "DELETE", token });
}

export const FREQUENCY_LABELS = { daily: "Quotidienne", weekly: "Hebdomadaire" };
