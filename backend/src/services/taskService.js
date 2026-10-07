import { Task } from '../models/Task.js';
import { notFound } from '../utils/httpError.js';
import { assertObjectId } from '../validators/common.js';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  parseTaskFilters,
  validateCreateTask,
  validateUpdateTask,
} from '../validators/taskValidator.js';

// Règle d'or : ownerId vient toujours du JWT vérifié (req.userId), jamais du client.
// Toutes les requêtes filtrent sur { ownerId } : un objet d'un autre compte
// est donc introuvable (404), exactement comme un objet absent.

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Traduit les filtres validés en requête MongoDB
function buildMongoFilter(ownerId, filters) {
  const mongoFilter = { ownerId };
  if (filters.status) mongoFilter.status = { $in: filters.status };
  if (filters.priority) mongoFilter.priority = { $in: filters.priority };

  if (filters.hasDueDate === false) {
    mongoFilter.dueDate = null;
  } else if (filters.hasDueDate === true || filters.dueFrom || filters.dueTo) {
    // Les dates "YYYY-MM-DD" se comparent correctement comme des chaînes
    mongoFilter.dueDate = { $ne: null };
    if (filters.dueFrom) mongoFilter.dueDate.$gte = filters.dueFrom;
    if (filters.dueTo) mongoFilter.dueDate.$lte = filters.dueTo;
  }

  if (filters.q) mongoFilter.title = { $regex: escapeRegex(filters.q), $options: 'i' };
  return mongoFilter;
}

function sortTasks(tasks, sort) {
  if (sort === 'dueDate') {
    // Échéance la plus proche d'abord, tâches sans échéance à la fin
    return tasks.sort((a, b) => {
      if (a.dueDate === b.dueDate) return 0;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    });
  }
  if (sort === 'priority') {
    return tasks.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  }
  return tasks; // createdAt : déjà trié par MongoDB (plus récente d'abord)
}

export async function listTasks(ownerId, query = {}) {
  const filters = parseTaskFilters(query);
  const tasks = await Task.find(buildMongoFilter(ownerId, filters)).sort({ createdAt: -1, _id: -1 });
  return sortTasks(tasks, filters.sort);
}

// Bonus B1 : compteur de tâches (mêmes filtres que la liste)
export async function countTasks(ownerId, query = {}) {
  const filters = parseTaskFilters(query);
  const tasks = await Task.find(buildMongoFilter(ownerId, filters), { status: 1, priority: 1 }).lean();

  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]));
  const byPriority = Object.fromEntries(TASK_PRIORITIES.map((p) => [p, 0]));
  for (const task of tasks) {
    byStatus[task.status] += 1;
    byPriority[task.priority ?? 'medium'] += 1;
  }
  return { total: tasks.length, byStatus, byPriority };
}

export async function getTaskById(ownerId, taskId) {
  assertObjectId(taskId, 'Identifiant de tâche');
  const task = await Task.findOne({ _id: taskId, ownerId });
  if (!task) throw notFound('Tâche introuvable');
  return task;
}

export function createTask(ownerId, body) {
  const data = validateCreateTask(body);
  const completedAt = data.status === 'done' ? new Date() : null;
  return Task.create({ ...data, completedAt, ownerId });
}

export async function updateTask(ownerId, taskId, body) {
  assertObjectId(taskId, 'Identifiant de tâche');
  const data = validateUpdateTask(body);

  const task = await Task.findOne({ _id: taskId, ownerId });
  if (!task) throw notFound('Tâche introuvable');

  // completedAt suit le statut : renseigné au passage à "done", effacé sinon
  if (data.status && data.status !== task.status) {
    task.completedAt = data.status === 'done' ? new Date() : null;
  }
  task.set(data);
  return task.save();
}

export async function deleteTask(ownerId, taskId) {
  assertObjectId(taskId, 'Identifiant de tâche');
  const task = await Task.findOneAndDelete({ _id: taskId, ownerId });
  if (!task) throw notFound('Tâche introuvable');
}
