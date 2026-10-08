import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

// { token, user, isAuthenticated, login, register, logout }
export function useAuth() {
  return useContext(AuthContext);
}
