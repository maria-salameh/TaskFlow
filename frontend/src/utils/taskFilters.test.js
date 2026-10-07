import { describe, expect, test } from "vitest";
import { DEFAULT_FILTERS, buildTaskQuery, hasActiveFilters, isOverdue } from "./taskFilters.js";

const today = "2026-10-07";

describe("buildTaskQuery (bonus B1)", () => {
  test("sans filtre : aucun paramètre", () => {
    expect(buildTaskQuery(DEFAULT_FILTERS, today)).toEqual({ sort: undefined });
  });

  test("statut, priorité, recherche et tri", () => {
    expect(
      buildTaskQuery({ ...DEFAULT_FILTERS, status: "doing", priority: "high", q: "  rapport ", sort: "dueDate" }, today),
    ).toEqual({ status: "doing", priority: "high", q: "rapport", sort: "dueDate" });
  });

  test("en retard : échéance jusqu'à hier et tâches non terminées", () => {
    expect(buildTaskQuery({ ...DEFAULT_FILTERS, due: "overdue" }, today)).toMatchObject({
      dueTo: "2026-10-06",
      status: "todo,doing",
    });
  });

  test("en retard + statut choisi : le statut de l'utilisateur est conservé", () => {
    expect(buildTaskQuery({ ...DEFAULT_FILTERS, due: "overdue", status: "doing" }, today).status).toBe("doing");
  });

  test("aujourd'hui, 7 prochains jours, sans échéance", () => {
    expect(buildTaskQuery({ ...DEFAULT_FILTERS, due: "today" }, today)).toMatchObject({
      dueFrom: today,
      dueTo: today,
    });
    expect(buildTaskQuery({ ...DEFAULT_FILTERS, due: "week" }, today)).toMatchObject({
      dueFrom: today,
      dueTo: "2026-10-13",
    });
    expect(buildTaskQuery({ ...DEFAULT_FILTERS, due: "none" }, today)).toMatchObject({ hasDueDate: "false" });
  });

  test("hasActiveFilters ignore le tri et les espaces", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "priority", q: "  " })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, priority: "low" })).toBe(true);
  });
});

describe("isOverdue", () => {
  test("échéance passée et non terminée", () => {
    expect(isOverdue({ dueDate: "2026-10-06", status: "todo" }, today)).toBe(true);
    expect(isOverdue({ dueDate: "2026-10-06", status: "done" }, today)).toBe(false);
    expect(isOverdue({ dueDate: today, status: "todo" }, today)).toBe(false);
    expect(isOverdue({ dueDate: null, status: "todo" }, today)).toBe(false);
  });
});
