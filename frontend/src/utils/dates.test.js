import { describe, expect, test } from "vitest";
import { addDays, formatDateKey, startOfWeek, toDateKey } from "./dates.js";

describe("dates civiles", () => {
  test("toDateKey formate en YYYY-MM-DD avec des zéros", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("addDays traverse les fins de mois, d'année et les années bissextiles", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    // passage à l'heure d'hiver le 25 octobre 2026 : pas de jour sauté
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });

  test("startOfWeek renvoie le lundi (le dimanche appartient à la semaine qui finit)", () => {
    expect(startOfWeek("2026-10-07")).toBe("2026-10-05"); // mercredi
    expect(startOfWeek("2026-10-05")).toBe("2026-10-05"); // lundi
    expect(startOfWeek("2026-10-11")).toBe("2026-10-05"); // dimanche
  });

  test("formatDateKey affiche la date en français sans décalage", () => {
    expect(formatDateKey("2026-10-05")).toBe("5 oct. 2026");
    expect(formatDateKey(null)).toBe("");
  });
});
