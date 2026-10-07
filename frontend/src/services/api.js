// Client HTTP commun (fetch) : ajoute le JWT, parse le JSON et transforme
// les erreurs du contrat ({ error: { code, message } }) en exceptions lisibles.
//
// Par défaut les appels sont relatifs (/api/...) : en développement, le proxy Vite
// les transmet au backend (voir vite.config.js). VITE_API_URL permet de viser
// une autre adresse (ex. une API déployée).
export const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Construit "?a=1&b=2" en ignorant les valeurs vides
export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function apiRequest(path, { method = "GET", body, token, query } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Impossible de joindre l'API. Le backend est-il démarré ?");
  }

  // 204 : succès sans corps (DELETE)
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message ?? `Erreur ${response.status}`;
    const code = data?.error?.code ?? "UNKNOWN";
    throw new ApiError(response.status, code, message);
  }
  return data;
}
