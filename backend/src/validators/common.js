import mongoose from 'mongoose';
import { invalidInput } from '../utils/httpError.js';

// Vrai uniquement pour une date civile réelle au format YYYY-MM-DD (refuse 2026-02-30).
export function isValidCivilDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

// Le corps doit être un objet JSON simple (pas un tableau, pas null).
export function assertPlainObject(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw invalidInput('Le corps de la requête doit être un objet JSON');
  }
}

// Refuse toute propriété qui ne fait pas partie des champs métier documentés
// (protège notamment contre l'envoi de id, ownerId, completedAt...).
export function assertOnlyFields(body, allowedFields) {
  const unknown = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (unknown.length > 0) {
    throw invalidInput(`Champ(s) non autorisé(s) : ${unknown.join(', ')}`);
  }
}

export function validateTitle(value) {
  if (typeof value !== 'string') {
    throw invalidInput('Le titre doit être une chaîne de caractères');
  }
  const title = value.trim();
  if (title.length < 1 || title.length > 120) {
    throw invalidInput('Le titre doit contenir entre 1 et 120 caractères');
  }
  return title;
}

// Identifiant MongoDB malformé => 400 (un id valide mais absent donnera 404).
export function assertObjectId(id, label = 'Identifiant') {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id) || !/^[a-f\d]{24}$/i.test(id)) {
    throw invalidInput(`${label} invalide`);
  }
}

// Lecture d'une date civile passée en paramètre de requête (?from=2026-10-01).
export function parseQueryDate(value, name) {
  if (value === undefined) return undefined;
  if (!isValidCivilDate(value)) {
    throw invalidInput(`Le paramètre ${name} doit être une date réelle au format YYYY-MM-DD`);
  }
  return value;
}

// Liste séparée par des virgules dont chaque valeur doit appartenir à `allowed`.
export function parseQueryList(value, name, allowed) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0) {
    throw invalidInput(`Le paramètre ${name} est invalide`);
  }
  const values = value.split(',');
  if (!values.every((v) => allowed.includes(v))) {
    throw invalidInput(`Le paramètre ${name} accepte uniquement : ${allowed.join(', ')}`);
  }
  return [...new Set(values)];
}
