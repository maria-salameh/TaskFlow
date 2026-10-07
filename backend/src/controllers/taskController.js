import * as taskService from '../services/taskService.js'

// Les réponses suivent le contrat API v1 du livret (partie 4.4).

export async function getAllTasks(request, response) {
  const tasks = await taskService.listTasks(request.userId);
  return response.status(200).json({ items: tasks });
}

export async function getTask(request, response) {
  const task = await taskService.getTaskById(request.userId, request.params.id);
  return response.status(200).json(task);
}

export async function createTask(request, response) {
  const task = await taskService.createTask(request.userId, request.body);
  return response.status(201).json(task);
}

export async function updateTask(request, response) {
  const task = await taskService.updateTask(request.userId, request.params.id, request.body);
  return response.status(200).json(task);
}

export async function deleteTask(request, response) {
  await taskService.deleteTask(request.userId, request.params.id);
  return response.status(204).end();
}
