import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Heatmap from "../components/Heatmap.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { apiRequest } from "../services/api.js";
import { browserTimeZone, formatLongDateKey, todayKey } from "../utils/dates.js";
import { buildHeatmapWeeks, heatmapRange, summarize } from "../utils/heatmap.js";

const MODES = {
  count: { label: "Tout", valueOf: (d) => d.count },
  tasks: { label: "Tâches terminées", valueOf: (d) => d.tasks },
  habits: { label: "Habitudes", valueOf: (d) => d.habits },
};

// Bonus B3 : heatmap des 12 derniers mois.
// L'agrégation est faite par l'API (GET /api/stats/heatmap) dans le fuseau du navigateur.
export default function ActivityPage() {
  const { token, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("count");
  const today = todayKey();
  const timeZone = browserTimeZone();

  const load = useCallback(async () => {
    setError(null);
    try {
      const { from, to } = heatmapRange(today);
      setData(await apiRequest("/api/stats/heatmap", { token, query: { from, to, tz: timeZone } }));
    } catch (err) {
      if (err.status === 401) logout();
      setError(err.message);
    }
  }, [token, logout, today, timeZone]);

  useEffect(() => {
    load();
  }, [load]);

  const { valueOf } = MODES[mode];
  const view = useMemo(() => {
    if (!data) return null;
    const { weeks } = buildHeatmapWeeks(data.days, data.from, today, valueOf);
    return { weeks, summary: summarize(data.days, valueOf) };
  }, [data, today, valueOf]);

  return (
    <section className="page activity-page">
      <h1>Activité</h1>
      <p className="page-intro muted">
        Chaque case est un jour : tâches passées à « Terminée » et habitudes réalisées. Fuseau horaire : {timeZone}.
      </p>

      {error && (
        <div>
          <ErrorMessage message={error} />
          <button type="button" className="btn" onClick={load}>
            Réessayer
          </button>
        </div>
      )}
      {!error && !view && (
        <p className="muted" role="status">
          Chargement de l'activité…
        </p>
      )}

      {view && (
        <>
          <div className="activity-toolbar">
            <div className="segmented" role="radiogroup" aria-label="Type d'activité">
              {Object.entries(MODES).map(([key, { label }]) => (
                <button key={key} type="button" role="radio" aria-checked={mode === key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card heatmap-card">
            <Heatmap
              weeks={view.weeks}
              label={`${view.summary.total} activités sur 12 mois, ${view.summary.activeDays} jours actifs`}
            />
          </div>

          <dl className="activity-summary">
            <div>
              <dt>Total sur 12 mois</dt>
              <dd>{view.summary.total}</dd>
            </div>
            <div>
              <dt>Jours actifs</dt>
              <dd>{view.summary.activeDays}</dd>
            </div>
            <div>
              <dt>Meilleur jour</dt>
              <dd>{view.summary.best ? `${formatLongDateKey(view.summary.best.date)} (${view.summary.best.value})` : "—"}</dd>
            </div>
          </dl>
          {view.summary.total === 0 && (
            <p className="empty">Pas encore d'activité : terminez une tâche ou cochez une habitude pour remplir la grille.</p>
          )}
        </>
      )}
    </section>
  );
}
