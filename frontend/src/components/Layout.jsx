import { useAuth } from "../hooks/useAuth.js";
import Sidebar from "./Sidebar.jsx";

// Connecté : barre latérale + contenu. Non connecté : écrans de connexion plein écran.
export default function Layout({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <main className="auth-shell">{children}</main>;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Sidebar />
      <main className="app-main" id="contenu" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
