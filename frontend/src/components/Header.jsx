import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="header">
      <NavLink to="/" className="brand">TaskFlow</NavLink>
      <nav className="nav" aria-label="Navigation principale">
        {isAuthenticated ? (
          <>
            <NavLink to="/" end>Mes tâches</NavLink>
            <NavLink to="/calendar">Calendrier</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <button type="button" className="nav-logout" onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Connexion</NavLink>
            <NavLink to="/register">Inscription</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
