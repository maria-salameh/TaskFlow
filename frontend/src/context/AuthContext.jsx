import { useCallback, useState, createContext } from "react";
import * as authService from "../services/authServices.js";

// Stratégie de session : le JWT est gardé dans le localStorage pour survivre à un
// rechargement de page. Compromis : simple, mais lisible par un script injecté (XSS),
// d'où l'expiration du jeton (7 jours par défaut) et React qui échappe le contenu affiché.
// La vraie protection des données reste la vérification du JWT par l'API.
export const AuthContext = createContext(null);

function readSession() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") ?? "null");
    if (!token || token === "undefined" || token === "null")
      return { token: null, user: null };
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  function saveSession({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setSession({ token, user });
  }

  async function login(email, password) {
    saveSession(await authService.login(email, password));
  }

  async function register(email, password) {
    saveSession(await authService.register(email, password));
  }

  // useCallback : fonction stable, utilisée comme dépendance dans les hooks de données
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token: session.token,
        user: session.user,
        isAuthenticated: Boolean(session.token),
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
