import { createContext, useState } from "react";
import * as authService from "../services/authServices.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  async function login(email, password) {
    const { token } = await authService.login(email, password);
    localStorage.setItem("token", token);
    setToken(token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  async function register(email, name, password) {
    const res = await authService.register(email, name, password);
    localStorage.setItem("token", res.token);
    setToken(res.token);
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}