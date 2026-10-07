import { apiRequest } from "./api.js";

// Appels aux routes /api/tasks (5 routes du contrat + compteur du bonus B1)

export async function listTasks(token, query) {
  const data = await apiRequest("/api/tasks", { token, query });
  return data.items;
}

export function countTasks(token, query) {
  return apiRequest("/api/tasks/count", { token, query });
}

export function getTask(token, id) {
  return apiRequest(`/api/tasks/${id}`, { token });
}

export function createTask(token, task) {
  return apiRequest("/api/tasks", { method: "POST", body: task, token });
}

export function updateTask(token, id, changes) {
  return apiRequest(`/api/tasks/${id}`, { method: "PATCH", body: changes, token });
}

export function deleteTask(token, id) {
  return apiRequest(`/api/tasks/${id}`, { method: "DELETE", token });
}

export const STATUS_LABELS = {
  todo: "À faire",
  doing: "En cours",
  done: "Terminée",
};

export const PRIORITY_LABELS = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};
