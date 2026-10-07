import { Task } from '../models/Task.js';
import { HabitLog } from '../models/HabitLog.js';
import { invalidInput } from '../utils/httpError.js';
import { assertOnlyFields, parseQueryDate } from '../validators/common.js';

// Bonus B3 : heatmap type GitHub.
//
// Pour chaque jour de [from, to] on compte :
//   - tasks  : tâches passées à "done" ce jour-là (completedAt), jour calculé
//              dans le fuseau horaire de l'utilisateur (paramètre tz) ;
//   - habits : réalisations d'habitudes (déjà des dates civiles) ;
//   - count  : tasks + habits.
// Tous les jours de la période sont renvoyés, y compris ceux à zéro.
// Une tâche repassée en "todo"/"doing" perd son completedAt et ne compte plus.

const MAX_DAYS = 400;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Date civile "YYYY-MM-DD" d'un instant, vue depuis le fuseau tz
export function toCivilDate(instant, tz) {
  // en-CA formate en YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

function addDays(civilDate, days) {
  const [y, m, d] = civilDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from, to) {
  const days = [];
  for (let date = from; date <= to; date = addDays(date, 1)) days.push(date);
  return days;
}

export function parseHeatmapQuery(query, now = new Date()) {
  assertOnlyFields(query, ['from', 'to', 'tz']);
  const tz = query.tz ?? 'UTC';
  if (typeof tz !== 'string' || !isValidTimeZone(tz)) {
    throw invalidInput('Le paramètre tz doit être un fuseau horaire IANA (ex. Europe/Paris)');
  }
  const to = parseQueryDate(query.to, 'to') ?? toCivilDate(now, tz);
  // Par défaut : 53 semaines glissantes, comme sur GitHub
  const from = parseQueryDate(query.from, 'from') ?? addDays(to, -370);
  if (from > to) throw invalidInput('from doit être antérieure ou égale à to');
  if (daysBetween(from, to).length > MAX_DAYS) {
    throw invalidInput(`La période ne peut pas dépasser ${MAX_DAYS} jours`);
  }
  return { from, to, tz };
}

export async function getHeatmap(ownerId, query) {
  const { from, to, tz } = parseHeatmapQuery(query);

  // Fenêtre UTC élargie de ±1 jour pour couvrir tous les fuseaux (UTC-12 à UTC+14),
  // puis on ne garde que les jours qui tombent dans [from, to] une fois convertis.
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const windowStart = new Date(Date.UTC(fy, fm - 1, fd) - DAY_MS);
  const windowEnd = new Date(Date.UTC(ty, tm - 1, td) + 2 * DAY_MS);

  const [tasks, logs] = await Promise.all([
    Task.find(
      { ownerId, status: 'done', completedAt: { $gte: windowStart, $lt: windowEnd } },
      { completedAt: 1 },
    ).lean(),
    HabitLog.find({ ownerId, date: { $gte: from, $lte: to } }, { date: 1 }).lean(),
  ]);

  const counts = new Map(daysBetween(from, to).map((date) => [date, { tasks: 0, habits: 0 }]));
  for (const task of tasks) {
    const day = counts.get(toCivilDate(task.completedAt, tz));
    if (day) day.tasks += 1;
  }
  for (const log of logs) {
    const day = counts.get(log.date);
    if (day) day.habits += 1;
  }

  const days = [...counts.entries()].map(([date, c]) => ({
    date,
    tasks: c.tasks,
    habits: c.habits,
    count: c.tasks + c.habits,
  }));

  return {
    from,
    to,
    timezone: tz,
    total: days.reduce((sum, d) => sum + d.count, 0),
    max: days.reduce((max, d) => Math.max(max, d.count), 0),
    days,
  };
}
