import { createContext, useCallback, useState } from "react";
import * as authService from "../services/authServices.js";

export const AuthContext = createContext(null);

function readStoredToken() {
  const stored = localStorage.getItem("token");
  // Ignore une valeur cassée laissée par une ancienne version ("undefined")
  return stored && stored !== "undefined" && stored !== "null" ? stored : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);

  function saveToken(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  async function login(email, password) {
    const { token } = await authService.login(email, password);
    if (!token) throw new Error("Réponse de connexion invalide");
    saveToken(token);
  }

  // useCallback : fonction stable, utilisée comme dépendance dans useTasks
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  async function register(email, name, password) {
    const res = await authService.register(email, name, password);
    // Le contrat prévoit que register renvoie { user, token }.
    // Tant que l'API ne renvoie pas de token, on enchaîne avec un login.
    if (res?.token) {
      saveToken(res.token);
    } else {
      await login(email, password);
    }
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}
