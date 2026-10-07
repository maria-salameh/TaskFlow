import { invalidInput } from '../utils/httpError.js';

export const TASK_STATUSES = ['todo', 'doing', 'done'];
const ALLOWED_FIELDS = ['title', 'status', 'description', 'dueDate'];

// Vrai uniquement pour une date civile réelle au format YYYY-MM-DD (refuse 2026-02-30).
export function isValidCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function checkFields(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw invalidInput('Le corps de la requête doit être un objet JSON');
  }
  const unknown = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
  if (unknown.length > 0) {
    throw invalidInput(`Champ(s) non autorisé(s) : ${unknown.join(', ')}`);
  }
}

function validateValues(body) {
  const clean = {};

  if ('title' in body) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 120) {
      throw invalidInput('Le titre doit contenir entre 1 et 120 caractères');
    }
    clean.title = body.title.trim();
  }

  if ('status' in body) {
    if (!TASK_STATUSES.includes(body.status)) {
      throw invalidInput('Le statut doit être todo, doing ou done');
    }
    clean.status = body.status;
  }

  if ('description' in body) {
    if (typeof body.description !== 'string' || body.description.length > 1000) {
      throw invalidInput('La description doit faire au plus 1000 caractères');
    }
    clean.description = body.description;
  }

  if ('dueDate' in body) {
    if (body.dueDate !== null && !isValidCivilDate(body.dueDate)) {
      throw invalidInput("L'échéance doit être une date réelle au format YYYY-MM-DD ou null");
    }
    clean.dueDate = body.dueDate;
  }

  return clean;
}

// POST : title et status obligatoires.
export function validateCreateTask(body) {
  checkFields(body);
  if (!('title' in body) || !('status' in body)) {
    throw invalidInput('Les champs title et status sont obligatoires');
  }
  return validateValues(body);
}

// PATCH : partiel mais non vide.
export function validateUpdateTask(body) {
  checkFields(body);
  if (Object.keys(body).length === 0) {
    throw invalidInput('Aucun champ à modifier');
  }
  return validateValues(body);
}
