import { describe, expect, test, vi } from "vitest";
import { ApiError, apiRequest, toQueryString } from "./api.js";

function mockFetch(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => (body === undefined ? Promise.reject(new Error("no body")) : Promise.resolve(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiRequest", () => {
  test("envoie le JWT en Bearer et le corps en JSON", async () => {
    const fetchMock = mockFetch(201, { id: "1" });
    await apiRequest("/api/tasks", { method: "POST", body: { title: "T" }, token: "abc" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tasks");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer abc");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe('{"title":"T"}');
  });

  test("ajoute les paramètres de requête en ignorant les valeurs vides", async () => {
    const fetchMock = mockFetch(200, { items: [] });
    await apiRequest("/api/tasks", { query: { status: "todo", q: "", priority: undefined } });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/tasks?status=todo");
  });

  test("204 : renvoie null sans lire de corps", async () => {
    mockFetch(204);
    await expect(apiRequest("/api/tasks/1", { method: "DELETE" })).resolves.toBeNull();
  });

  test("transforme l'erreur du contrat en ApiError lisible", async () => {
    mockFetch(400, { error: { code: "INVALID_INPUT", message: "Le titre est obligatoire" } });
    const error = await apiRequest("/api/tasks", { method: "POST", body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "INVALID_INPUT", message: "Le titre est obligatoire" });
  });

  test("API injoignable : message explicite", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiRequest("/api/tasks")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});

test("toQueryString", () => {
  expect(toQueryString({})).toBe("");
  expect(toQueryString({ a: "1", b: null, c: "x y" })).toBe("?a=1&c=x+y");
});
