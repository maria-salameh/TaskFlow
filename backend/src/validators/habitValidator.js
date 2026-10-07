import { invalidInput } from '../utils/httpError.js';
import { assertOnlyFields, assertPlainObject, isValidCivilDate, validateTitle } from './common.js';

// Bonus B2 : une habitude est récurrente (quotidienne ou hebdomadaire),
// contrairement à une tâche ponctuelle qu'on coche une seule fois.
export const HABIT_FREQUENCIES = ['daily', 'weekly'];
const ALLOWED_FIELDS = ['title', 'frequency', 'active'];

function validateValues(body) {
  const clean = {};
  if ('title' in body) clean.title = validateTitle(body.title);
  if ('frequency' in body) {
    if (!HABIT_FREQUENCIES.includes(body.frequency)) {
      throw invalidInput('La fréquence doit être daily ou weekly');
    }
    clean.frequency = body.frequency;
  }
  if ('active' in body) {
    if (typeof body.active !== 'boolean') {
      throw invalidInput('Le champ active doit être un booléen (true ou false)');
    }
    clean.active = body.active;
  }
  return clean;
}

// POST : title et frequency obligatoires ; active vaut true par défaut.
export function validateCreateHabit(body) {
  assertPlainObject(body);
  assertOnlyFields(body, ALLOWED_FIELDS);
  if (!('title' in body) || !('frequency' in body)) {
    throw invalidInput('Les champs title et frequency sont obligatoires');
  }
  return validateValues(body);
}

export function validateUpdateHabit(body) {
  assertPlainObject(body);
  assertOnlyFields(body, ALLOWED_FIELDS);
  if (Object.keys(body).length === 0) throw invalidInput('Aucun champ à modifier');
  return validateValues(body);
}

// Date d'une réalisation : date civile réelle, pas dans le futur.
// On tolère J+1 en UTC car il est déjà "demain" dans les fuseaux en avance (UTC+14 max).
export function validateLogDate(date) {
  if (!isValidCivilDate(date)) {
    throw invalidInput('La date doit être une date réelle au format YYYY-MM-DD');
  }
  const tomorrowUtc = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (date > tomorrowUtc) {
    throw invalidInput('Impossible de valider une habitude dans le futur');
  }
  return date;
}
