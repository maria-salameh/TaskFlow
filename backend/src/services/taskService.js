import mongoose from 'mongoose'
import { Task } from '../models/Task.js'
import { invalidInput, notFound } from '../utils/httpError.js'
import { validateCreateTask, validateUpdateTask } from '../validators/taskValidator.js'

function checkId(taskId) {
  if (!mongoose.isValidObjectId(taskId)) {
    throw invalidInput('Identifiant de tâche invalide');
  }
}

// ownerId vient toujours du JWT vérifié, jamais du corps de la requête.
export function listTasks(ownerId) {
  return Task.find({ ownerId }).sort({ createdAt: -1 });
}

export async function getTaskById(ownerId, taskId) {
  checkId(taskId);
  const task = await Task.findOne({ _id: taskId, ownerId });
  if (!task) throw notFound('Tâche introuvable');
  return task;
}

export function createTask(ownerId, body) {
  const data = validateCreateTask(body);
  return Task.create({ ...data, ownerId });
}

export async function updateTask(ownerId, taskId, body) {
  checkId(taskId);
  const data = validateUpdateTask(body);
  const task = await Task.findOneAndUpdate({ _id: taskId, ownerId }, data, {
    new: true,
    runValidators: true,
  });
  if (!task) throw notFound('Tâche introuvable');
  return task;
}

export async function deleteTask(ownerId, taskId) {
  checkId(taskId);
  const task = await Task.findOneAndDelete({ _id: taskId, ownerId });
  if (!task) throw notFound('Tâche introuvable');
}
