import { addDays, startOfWeek } from "./dates.js";

// Bonus B2 : règles de calcul des habitudes (testées dans habits.test.js).
//  - habitude quotidienne : réalisée un jour donné s'il existe un log à cette date ;
//  - habitude hebdomadaire : réalisée une semaine (lundi -> dimanche) s'il existe
//    au moins un log dans la semaine ;
//  - série (streak) : nombre de périodes consécutives réalisées en remontant depuis
//    la période en cours. Si la période en cours n'est pas encore réalisée, la série
//    n'est pas cassée : on compte à partir de la période précédente.

// Les n derniers jours, du plus ancien au plus récent (aujourd'hui inclus)
export function lastDays(today, n) {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

// Les lundis des n dernières semaines, du plus ancien au plus récent
export function lastWeekStarts(today, n) {
  const current = startOfWeek(today);
  return Array.from({ length: n }, (_, i) => addDays(current, (i - (n - 1)) * 7));
}

export function datesInWeek(dates, weekStart) {
  const weekEnd = addDays(weekStart, 6);
  return dates.filter((date) => date >= weekStart && date <= weekEnd);
}

export function isPeriodDone(habit, dates, periodStart) {
  if (habit.frequency === "weekly") return datesInWeek(dates, periodStart).length > 0;
  return dates.includes(periodStart);
}

export function currentStreak(habit, dates, today) {
  const weekly = habit.frequency === "weekly";
  const step = weekly ? 7 : 1;
  let period = weekly ? startOfWeek(today) : today;

  // Période en cours pas encore faite : on part de la précédente
  if (!isPeriodDone(habit, dates, period)) period = addDays(period, -step);

  let streak = 0;
  while (isPeriodDone(habit, dates, period)) {
    streak += 1;
    period = addDays(period, -step);
  }
  return streak;
}

// Regroupe les logs reçus de l'API par habitude : { habitId: ["2026-10-01", ...] }
export function groupLogsByHabit(logs) {
  const map = {};
  for (const log of logs) (map[log.habitId] ??= []).push(log.date);
  return map;
}
