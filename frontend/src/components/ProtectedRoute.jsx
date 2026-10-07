import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

// Redirige vers /login si l'utilisateur n'est pas connecté.
// Rappel : c'est l'API qui protège réellement les données, pas React.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
