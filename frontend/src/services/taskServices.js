import { apiRequest } from "./api.js";

// Appels aux 5 routes du contrat TaskFlow (/api/tasks)

export async function listTasks(token) {
  const data = await apiRequest("/api/tasks", { token });
  return data.items;
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
