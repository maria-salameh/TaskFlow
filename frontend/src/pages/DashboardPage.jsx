// Page Dashboard : volontairement vide, à développer.
// La route /dashboard est déjà branchée dans App.jsx et protégée par ProtectedRoute.
// Pour récupérer les tâches de l'utilisateur :
//   import { useTasks } from "../hooks/useTasks.js";
//   const { tasks, loading, error } = useTasks();

export default function DashboardPage() {
  return (
    <section className="page dashboard-page">
      <h1>Dashboard</h1>
    </section>
  );
}
