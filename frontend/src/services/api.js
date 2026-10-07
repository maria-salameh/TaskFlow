// Petit client HTTP commun : ajoute le JWT, parse le JSON et transforme
// les erreurs du contrat ({ error: { code, message } }) en exceptions lisibles.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Impossible de joindre l'API. Le backend est-il démarré ?");
  }

  // 204 : pas de corps
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message ?? data?.message ?? `Erreur ${response.status}`;
    const code = data?.error?.code ?? "UNKNOWN";
    throw new ApiError(response.status, code, message);
  }
  return data;
}
