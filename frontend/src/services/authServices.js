import { apiRequest } from "./api.js";

// Les deux routes renvoient { user: { id, email }, token }

export function login(email, password) {
  return apiRequest("/api/auth/login", { method: "POST", body: { email, password } });
}

export function register(email, password) {
  return apiRequest("/api/auth/register", { method: "POST", body: { email, password } });
}
