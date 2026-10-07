import { useMemo } from "react";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useTasks } from "../hooks/useTasks.js";
import { STATUS_LABELS } from "../services/taskServices.js";

export default function DashboardPage() {
    const { tasks, loading, error, reload } = useTasks();

    // 1. Calculs statistiques globaux et par période
    const stats = useMemo(() => {
        const total = tasks.length;
        if (total === 0) {
            return {
                total: 0,
                completed: 0,
                completionRate: 0,
                byStatus: { todo: 0, doing: 0, done: 0 },
                thisWeekTotal: 0,
                thisWeekCompleted: 0,
                weeklyRate: 0,
            };
        }

        const byStatus = tasks.reduce(
            (acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            },
            { todo: 0, doing: 0, done: 0 }
        );

        const completed = byStatus.done || 0;
        const completionRate = Math.round((completed / total) * 100);

        // Calcul pour la semaine en cours (basé sur dueDate ou la date du jour)
        const now = new Date();
        const startOfWeek = new Date(now);
        // Ajustement pour démarrer au lundi
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekTasks = tasks.filter((t) => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            return d >= startOfWeek && d <= endOfWeek;
        });

        const thisWeekTotal = weekTasks.length;
        const thisWeekCompleted = weekTasks.filter((t) => t.status === "done").length;
        const weeklyRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 0;

        return {
            total,
            completed,
            completionRate,
            byStatus,
            thisWeekTotal,
            thisWeekCompleted,
            weeklyRate,
        };
    }, [tasks]);

    return (
        <section className="page dashboard-page">
            <h1>Tableau de bord & Statistiques</h1>

            {loading && <p className="muted">Chargement des statistiques…</p>}

            {!loading && error && (
                <div>
                    <ErrorMessage message={error} />
                    <button type="button" className="btn" onClick={reload}>Réessayer</button>
                </div>
            )}

            {!loading && !error && (
                <div className="dashboard-container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

                    {/* Section 1 : Indicateurs clés (KPIs) */}
                    <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <h3>Total Tâches</h3>
                            <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0" }}>{stats.total}</p>
                            <span className="muted">Enregistrées au total</span>
                        </div>

                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <h3>Taux Global</h3>
                            <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0", color: "#2e7d32" }}>
                                {stats.completionRate}%
                            </p>
                            <span className="muted">{stats.completed} sur {stats.total} terminées</span>
                        </div>

                        <div className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                            <h3>Taux Hebdomadaire</h3>
                            <p style={{ fontSize: "2rem", fontWeight: "bold", margin: "0.5rem 0", color: "#1976d2" }}>
                                {stats.weeklyRate}%
                            </p>
                            <span className="muted">{stats.thisWeekCompleted} / {stats.thisWeekTotal} cette semaine</span>
                        </div>
                    </div>

                    {/* Section 2 : Répartition détaillée par Statut */}
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <h2>Répartition par statut</h2>
                        <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => {
                                const count = stats.byStatus[key] || 0;
                                const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                return (
                                    <li key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <span className={`legend-dot status-${key}`} style={{ width: "12px", height: "12px", borderRadius: "50%", display: "inline-block" }} />
                                            <span>{label}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <span className="muted">{count} tâche(s)</span>
                                            <strong style={{ minWidth: "40px", textAlign: "right" }}>{percentage}%</strong>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Section 3 : Note explicative / Documentation des calculs */}
                    <div className="card" style={{ padding: "1.5rem", background: "#f9f9f9" }}>
                        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Notes sur les calculs & agrégations</h3>
                        <p className="muted" style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                            Les statistiques sont calculées dynamiquement côté client à partir de la liste des tâches récupérées via le hook <code>useTasks</code>.
                            Le <strong>taux de complétion global</strong> rapporte le nombre de tâches au statut <em>Terminée</em> sur le volume total.
                            Le <strong>taux hebdomadaire</strong> filtre spécifiquement les tâches dont l'échéance (<code>dueDate</code>) est comprise entre le lundi et le dimanche de la semaine courante.
                        </p>
                    </div>

                </div>
            )}
        </section>
    );
}