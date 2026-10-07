import { describe, expect, test } from "vitest";
import { buildHeatmapWeeks, heatmapRange, intensityLevel, monthLabels, summarize } from "./heatmap.js";

describe("heatmap (bonus B3)", () => {
  test("heatmapRange : 53 semaines commençant un lundi, jusqu'à aujourd'hui", () => {
    expect(heatmapRange("2026-10-07")).toEqual({ from: "2025-10-06", to: "2026-10-07" });
  });

  test("intensityLevel : 0 sans activité, 1 à 4 relativement au maximum", () => {
    expect(intensityLevel(0, 10)).toBe(0);
    expect(intensityLevel(0, 0)).toBe(0);
    expect(intensityLevel(1, 10)).toBe(1);
    expect(intensityLevel(5, 10)).toBe(2);
    expect(intensityLevel(8, 10)).toBe(4);
    expect(intensityLevel(10, 10)).toBe(4);
  });

  test("buildHeatmapWeeks : colonnes de 7 jours, cases futures vides, jours manquants à zéro", () => {
    const days = [
      { date: "2026-10-05", tasks: 1, habits: 1, count: 2 },
      { date: "2026-10-06", tasks: 0, habits: 1, count: 1 },
    ];
    const { weeks, max } = buildHeatmapWeeks(days, "2026-09-28", "2026-10-07");

    expect(max).toBe(2);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].cells).toHaveLength(7);
    expect(weeks[0].cells.every((c) => c.level === 0)).toBe(true);
    // Semaine en cours : lun, mar, mer remplis ; jeu -> dim dans le futur
    expect(weeks[1].cells.map((c) => c && c.level)).toEqual([4, 2, 0, null, null, null, null]);
  });

  test("buildHeatmapWeeks : la vue « habitudes » ne compte que les habitudes", () => {
    const days = [{ date: "2026-10-05", tasks: 3, habits: 1, count: 4 }];
    const { weeks } = buildHeatmapWeeks(days, "2026-10-05", "2026-10-05", (d) => d.habits);
    expect(weeks[0].cells[0]).toMatchObject({ value: 1, level: 4 });
  });

  test("monthLabels : un libellé au changement de mois", () => {
    const labels = monthLabels([{ weekStart: "2026-09-21" }, { weekStart: "2026-09-28" }, { weekStart: "2026-10-05" }]);
    expect(labels).toEqual(["sept", "", "oct"]);
  });

  test("summarize : total, jours actifs, meilleur jour ; période vide", () => {
    expect(
      summarize([
        { date: "2026-10-01", count: 0 },
        { date: "2026-10-02", count: 3 },
        { date: "2026-10-03", count: 1 },
      ]),
    ).toEqual({ total: 4, activeDays: 2, best: { date: "2026-10-02", value: 3 } });
    expect(summarize([])).toEqual({ total: 0, activeDays: 0, best: null });
  });
});
