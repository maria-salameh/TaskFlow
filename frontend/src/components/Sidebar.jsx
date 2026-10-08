import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import BrandMark from "./BrandMark.jsx";

const LINKS = [
  { to: "/", label: "Mes tâches", end: true },
  { to: "/calendar", label: "Calendrier" },
  { to: "/habits", label: "Habitudes" },
  { to: "/activity", label: "Activité" },
  { to: "/dashboard", label: "Dashboard" },
];

// Navigation principale : barre latérale sur ordinateur, barre du haut sur mobile
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sidebar">
      <NavLink to="/" className="brand">
        <BrandMark />
        <span>TaskFlow</span>
      </NavLink>

      <nav className="nav" aria-label="Navigation principale">
        {LINKS.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-account">
        {user?.email && (
          <p className="sidebar-email" title={user.email}>
            {user.email}
          </p>
        )}
        <button type="button" className="nav-logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
