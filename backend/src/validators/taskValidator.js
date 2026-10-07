import { invalidInput } from '../utils/httpError.js';
import {
  assertOnlyFields,
  assertPlainObject,
  isValidCivilDate,
  parseQueryDate,
  parseQueryList,
  validateTitle,
} from './common.js';

export const TASK_STATUSES = ['todo', 'doing', 'done'];
// Bonus B1 : priorité facultative (medium par défaut)
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const TASK_SORTS = ['createdAt', 'dueDate', 'priority'];

const ALLOWED_FIELDS = ['title', 'status', 'description', 'dueDate', 'priority'];

function validateValues(body) {
  const clean = {};

  if ('title' in body) clean.title = validateTitle(body.title);

  if ('status' in body) {
    if (!TASK_STATUSES.includes(body.status)) {
      throw invalidInput('Le statut doit être todo, doing ou done');
    }
    clean.status = body.status;
  }

  if ('description' in body) {
    if (typeof body.description !== 'string' || body.description.length > 1000) {
      throw invalidInput('La description doit être une chaîne de 1000 caractères au plus');
    }
    clean.description = body.description;
  }

  if ('dueDate' in body) {
    if (body.dueDate !== null && !isValidCivilDate(body.dueDate)) {
      throw invalidInput("L'échéance doit être une date réelle au format YYYY-MM-DD ou null");
    }
    clean.dueDate = body.dueDate;
  }

  if ('priority' in body) {
    if (!TASK_PRIORITIES.includes(body.priority)) {
      throw invalidInput('La priorité doit être low, medium ou high');
    }
    clean.priority = body.priority;
  }

  return clean;
}

// POST : title et status obligatoires, aucun champ inconnu (id, ownerId...).
export function validateCreateTask(body) {
  assertPlainObject(body);
  assertOnlyFields(body, ALLOWED_FIELDS);
  if (!('title' in body) || !('status' in body)) {
    throw invalidInput('Les champs title et status sont obligatoires');
  }
  return validateValues(body);
}

// PATCH : partiel mais non vide.
export function validateUpdateTask(body) {
  assertPlainObject(body);
  assertOnlyFields(body, ALLOWED_FIELDS);
  if (Object.keys(body).length === 0) {
    throw invalidInput('Aucun champ à modifier');
  }
  return validateValues(body);
}

// Bonus B1 : filtres de GET /api/tasks (tous facultatifs).
// Sans paramètre, la route se comporte exactement comme le contrat de base.
//   status=todo,doing  priority=high  dueFrom=YYYY-MM-DD  dueTo=YYYY-MM-DD
//   hasDueDate=true|false  q=texte  sort=createdAt|dueDate|priority
const ALLOWED_QUERY = ['status', 'priority', 'dueFrom', 'dueTo', 'hasDueDate', 'q', 'sort'];

export function parseTaskFilters(query) {
  assertOnlyFields(query, ALLOWED_QUERY);
  for (const [key, value] of Object.entries(query)) {
    if (typeof value !== 'string') throw invalidInput(`Le paramètre ${key} ne doit apparaître qu'une fois`);
  }

  const filters = {
    status: parseQueryList(query.status, 'status', TASK_STATUSES),
    priority: parseQueryList(query.priority, 'priority', TASK_PRIORITIES),
    dueFrom: parseQueryDate(query.dueFrom, 'dueFrom'),
    dueTo: parseQueryDate(query.dueTo, 'dueTo'),
    sort: query.sort ?? 'createdAt',
  };

  if (filters.dueFrom && filters.dueTo && filters.dueFrom > filters.dueTo) {
    throw invalidInput('dueFrom doit être antérieure ou égale à dueTo');
  }

  if (query.hasDueDate !== undefined) {
    if (!['true', 'false'].includes(query.hasDueDate)) {
      throw invalidInput('Le paramètre hasDueDate doit valoir true ou false');
    }
    filters.hasDueDate = query.hasDueDate === 'true';
  }

  if (query.q !== undefined) {
    const q = query.q.trim();
    if (q.length > 120) throw invalidInput('La recherche fait au plus 120 caractères');
    if (q) filters.q = q;
  }

  if (!TASK_SORTS.includes(filters.sort)) {
    throw invalidInput(`Le paramètre sort accepte uniquement : ${TASK_SORTS.join(', ')}`);
  }

  return filters;
}
