import { addDays } from "./dates.js";

// Bonus B1 : traduit les filtres de l'interface en paramètres de GET /api/tasks.
// Les périodes sont calculées côté navigateur (fuseau de l'utilisateur) puis
// envoyées comme dates civiles : le serveur n'a pas à deviner "aujourd'hui".

export const DEFAULT_FILTERS = { status: "", priority: "", due: "", sort: "createdAt", q: "" };

export const DUE_OPTIONS = {
  "": "Toutes les échéances",
  overdue: "En retard",
  today: "Aujourd'hui",
  week: "7 prochains jours",
  none: "Sans échéance",
};

export const SORT_OPTIONS = {
  createdAt: "Plus récentes",
  dueDate: "Échéance la plus proche",
  priority: "Priorité",
};

export function buildTaskQuery(filters, today) {
  const query = { sort: filters.sort === "createdAt" ? undefined : filters.sort };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.q?.trim()) query.q = filters.q.trim();

  switch (filters.due) {
    case "overdue":
      // En retard : échéance passée ET pas terminée
      query.dueTo = addDays(today, -1);
      if (!filters.status) query.status = "todo,doing";
      break;
    case "today":
      query.dueFrom = today;
      query.dueTo = today;
      break;
    case "week":
      query.dueFrom = today;
      query.dueTo = addDays(today, 6);
      break;
    case "none":
      query.hasDueDate = "false";
      break;
    default:
      break;
  }
  return query;
}

export function hasActiveFilters(filters) {
  return Boolean(filters.status || filters.priority || filters.due || filters.q?.trim());
}

export function isOverdue(task, today) {
  return Boolean(task.dueDate) && task.status !== "done" && task.dueDate < today;
}
