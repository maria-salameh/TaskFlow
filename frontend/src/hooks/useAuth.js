import { useContext } from "react";
import { AuthContext } from "../context/authContextObject.js";

// { token, user, isAuthenticated, login, register, logout }
export function useAuth() {
  return useContext(AuthContext);
}
