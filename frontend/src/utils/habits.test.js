import { describe, expect, test } from "vitest";
import { currentStreak, groupLogsByHabit, isPeriodDone, lastDays, lastWeekStarts } from "./habits.js";

const today = "2026-10-07"; // mercredi
const daily = { frequency: "daily" };
const weekly = { frequency: "weekly" };

describe("périodes (bonus B2)", () => {
  test("lastDays : du plus ancien à aujourd'hui", () => {
    expect(lastDays(today, 3)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
  });

  test("lastWeekStarts : les lundis des dernières semaines", () => {
    expect(lastWeekStarts(today, 3)).toEqual(["2026-09-21", "2026-09-28", "2026-10-05"]);
  });

  test("hebdomadaire : une réalisation n'importe quel jour suffit pour la semaine", () => {
    expect(isPeriodDone(weekly, ["2026-10-11"], "2026-10-05")).toBe(true); // dimanche
    expect(isPeriodDone(weekly, ["2026-10-12"], "2026-10-05")).toBe(false); // lundi suivant
  });
});

describe("currentStreak", () => {
  test("aucune réalisation : 0", () => {
    expect(currentStreak(daily, [], today)).toBe(0);
  });

  test("jours consécutifs jusqu'à aujourd'hui", () => {
    expect(currentStreak(daily, ["2026-10-05", "2026-10-06", "2026-10-07"], today)).toBe(3);
  });

  test("aujourd'hui pas encore coché : la série d'hier continue", () => {
    expect(currentStreak(daily, ["2026-10-05", "2026-10-06"], today)).toBe(2);
  });

  test("un jour manqué casse la série", () => {
    expect(currentStreak(daily, ["2026-10-03", "2026-10-04", "2026-10-06", "2026-10-07"], today)).toBe(2);
    expect(currentStreak(daily, ["2026-10-04", "2026-10-05"], today)).toBe(0);
  });

  test("hebdomadaire : semaines consécutives", () => {
    expect(currentStreak(weekly, ["2026-09-23", "2026-10-01"], today)).toBe(2); // semaine en cours pas encore faite
    expect(currentStreak(weekly, ["2026-09-23", "2026-10-01", "2026-10-06"], today)).toBe(3);
    expect(currentStreak(weekly, ["2026-09-16", "2026-10-01"], today)).toBe(1);
  });
});

test("groupLogsByHabit", () => {
  expect(
    groupLogsByHabit([
      { habitId: "a", date: "2026-10-01" },
      { habitId: "b", date: "2026-10-02" },
      { habitId: "a", date: "2026-10-03" },
    ]),
  ).toEqual({ a: ["2026-10-01", "2026-10-03"], b: ["2026-10-02"] });
});
