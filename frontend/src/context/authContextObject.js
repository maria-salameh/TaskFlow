import { createContext } from "react";

// Objet de contexte seul (séparé du composant AuthProvider pour le rechargement à chaud de Vite)
export const AuthContext = createContext(null);
