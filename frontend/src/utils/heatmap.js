import { addDays, parseDateKey, startOfWeek } from "./dates.js";

// Bonus B3 : mise en forme de la heatmap (testée dans heatmap.test.js).

export const HEATMAP_WEEKS = 53;

// Période affichée : 53 colonnes (semaines du lundi au dimanche) se terminant cette semaine
export function heatmapRange(today) {
  return { from: addDays(startOfWeek(today), -(HEATMAP_WEEKS - 1) * 7), to: today };
}

// Niveau d'intensité 0 à 4, relatif au meilleur jour de la période.
// 0 = aucune activité ; une activité non nulle a toujours au moins le niveau 1.
export function intensityLevel(count, max) {
  if (!count || !max) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

// Transforme la liste de jours de l'API en colonnes de 7 cases (lundi -> dimanche).
// Les jours postérieurs à `today` sont des cases vides (null).
export function buildHeatmapWeeks(days, from, today, valueOf = (d) => d.count) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const values = days.map(valueOf);
  const max = values.length ? Math.max(...values) : 0;

  const weeks = [];
  for (let weekStart = from; weekStart <= today; weekStart = addDays(weekStart, 7)) {
    const cells = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(weekStart, i);
      if (date > today) {
        cells.push(null);
        continue;
      }
      const day = byDate.get(date) ?? { date, tasks: 0, habits: 0, count: 0 };
      const value = valueOf(day);
      cells.push({ ...day, value, level: intensityLevel(value, max) });
    }
    weeks.push({ weekStart, cells });
  }
  return { weeks, max };
}

// Libellé du mois au-dessus de la première semaine qui commence dans ce mois
export function monthLabels(weeks) {
  let previousMonth = null;
  return weeks.map(({ weekStart }) => {
    const date = parseDateKey(weekStart);
    const month = date.getMonth();
    if (month === previousMonth) return "";
    previousMonth = month;
    return date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
  });
}

export function summarize(days, valueOf = (d) => d.count) {
  let total = 0;
  let activeDays = 0;
  let best = null;
  for (const day of days) {
    const value = valueOf(day);
    total += value;
    if (value > 0) activeDays += 1;
    if (value > 0 && (!best || value > best.value)) best = { date: day.date, value };
  }
  return { total, activeDays, best };
}
