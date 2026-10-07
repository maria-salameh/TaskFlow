import { Habit } from '../models/Habit.js';
import { HabitLog } from '../models/HabitLog.js';
import { invalidInput, notFound } from '../utils/httpError.js';
import { assertObjectId, assertOnlyFields, parseQueryDate } from '../validators/common.js';
import {
  validateCreateHabit,
  validateLogDate,
  validateUpdateHabit,
} from '../validators/habitValidator.js';

// Mêmes règles de propriété que pour les tâches : tout est filtré par ownerId.

async function findOwnedHabit(ownerId, habitId) {
  assertObjectId(habitId, "Identifiant d'habitude");
  const habit = await Habit.findOne({ _id: habitId, ownerId });
  if (!habit) throw notFound('Habitude introuvable');
  return habit;
}

export function listHabits(ownerId) {
  return Habit.find({ ownerId }).sort({ createdAt: -1, _id: -1 });
}

export function getHabit(ownerId, habitId) {
  return findOwnedHabit(ownerId, habitId);
}

export function createHabit(ownerId, body) {
  const data = validateCreateHabit(body);
  return Habit.create({ ...data, ownerId });
}

export async function updateHabit(ownerId, habitId, body) {
  const habit = await findOwnedHabit(ownerId, habitId);
  habit.set(validateUpdateHabit(body));
  return habit.save();
}

// Supprimer une habitude supprime aussi son historique
export async function deleteHabit(ownerId, habitId) {
  const habit = await findOwnedHabit(ownerId, habitId);
  await HabitLog.deleteMany({ habitId: habit._id, ownerId });
  await habit.deleteOne();
}

// ---- Réalisations (logs) ----

// PUT /api/habits/:id/logs/:date — idempotent : cocher deux fois le même jour
// ne crée pas de doublon. 201 si créé, 200 si déjà présent.
export async function markDone(ownerId, habitId, date) {
  const habit = await findOwnedHabit(ownerId, habitId);
  validateLogDate(date);
  if (!habit.active) {
    throw invalidInput('Cette habitude est désactivée : réactivez-la pour la cocher');
  }

  const existing = await HabitLog.findOne({ habitId: habit._id, date });
  if (existing) return { log: existing, created: false };

  try {
    const log = await HabitLog.create({ habitId: habit._id, ownerId, date });
    return { log, created: true };
  } catch (error) {
    // Deux clics simultanés : l'index unique (habitId, date) garantit l'unicité
    if (error.code === 11000) {
      return { log: await HabitLog.findOne({ habitId: habit._id, date }), created: false };
    }
    throw error;
  }
}

// DELETE /api/habits/:id/logs/:date — annule une réalisation
export async function unmarkDone(ownerId, habitId, date) {
  const habit = await findOwnedHabit(ownerId, habitId);
  validateLogDate(date);
  const log = await HabitLog.findOneAndDelete({ habitId: habit._id, ownerId, date });
  if (!log) throw notFound("Aucune réalisation à cette date");
}

function parseRange(query) {
  assertOnlyFields(query, ['from', 'to']);
  const from = parseQueryDate(query.from, 'from');
  const to = parseQueryDate(query.to, 'to');
  if (from && to && from > to) throw invalidInput('from doit être antérieure ou égale à to');
  const dateFilter = {};
  if (from) dateFilter.$gte = from;
  if (to) dateFilter.$lte = to;
  return Object.keys(dateFilter).length ? { date: dateFilter } : {};
}

// GET /api/habits/:id/logs?from=&to=
export async function listHabitLogs(ownerId, habitId, query) {
  const habit = await findOwnedHabit(ownerId, habitId);
  return HabitLog.find({ habitId: habit._id, ownerId, ...parseRange(query) }).sort({ date: 1 });
}

// GET /api/habit-logs?from=&to= — toutes les réalisations du compte (écran Habitudes)
export function listAllLogs(ownerId, query) {
  return HabitLog.find({ ownerId, ...parseRange(query) }).sort({ date: 1 });
}
