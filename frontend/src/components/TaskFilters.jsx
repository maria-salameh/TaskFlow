import { PRIORITY_LABELS, STATUS_LABELS } from "../services/taskServices.js";
import { DEFAULT_FILTERS, DUE_OPTIONS, SORT_OPTIONS, hasActiveFilters } from "../utils/taskFilters.js";

// Bonus B1 : barre de filtres de la liste des tâches
export default function TaskFilters({ value, onChange }) {
  function update(e) {
    onChange({ ...value, [e.target.name]: e.target.value });
  }

  return (
    <form className="task-filters" role="search" aria-label="Filtrer les tâches" onSubmit={(e) => e.preventDefault()}>
      <div className="filter-field filter-search">
        <label htmlFor="filter-q">Rechercher</label>
        <input id="filter-q" name="q" type="search" value={value.q} onChange={update} placeholder="Titre…" />
      </div>
      <div className="filter-field">
        <label htmlFor="filter-status">Statut</label>
        <select id="filter-status" name="status" value={value.status} onChange={update}>
          <option value="">Tous</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-priority">Priorité</label>
        <select id="filter-priority" name="priority" value={value.priority} onChange={update}>
          <option value="">Toutes</option>
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-due">Échéance</label>
        <select id="filter-due" name="due" value={value.due} onChange={update}>
          {Object.entries(DUE_OPTIONS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-sort">Trier par</label>
        <select id="filter-sort" name="sort" value={value.sort} onChange={update}>
          {Object.entries(SORT_OPTIONS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {hasActiveFilters(value) && (
        <button type="button" className="btn btn-link" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: value.sort })}>
          Effacer les filtres
        </button>
      )}
    </form>
  );
}
