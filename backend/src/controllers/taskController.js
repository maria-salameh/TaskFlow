import * as taskService from '../services/taskService.js'

export async function getAllTasks(request, response) {
    const tasks = await taskService.listTasks(request.userId)
    return response.status(200).json({ message: "Todos récupérées : ", tasks: tasks })
}

export async function createTask(request, response) {
  const task = await taskService.createTask(request.userId, request.body);
  return response.status(200).json({ message: "Tâche créée : ", task: task });
}

export async function updateTask(request, response) {
  const task = await taskService.updateTask(
    request.userId,
    request.params.id,
    request.body,
  );
  return response
    .status(200)
    .json({ message: "Tâche modifiée : ", task: task });
}

export async function deleteTask(request, response) {
  const task = await taskService.deleteTask(request.userId, request.params.id);
  return response
    .status(200)
    .json({ message: "Tâche supprimée : ", task: task });
}

