// Tests fonctionnels : connexion, inscription et protection des pages
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LoginPage from "./LoginPage.jsx";
import RegisterPage from "./RegisterPage.jsx";

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><p>Page privée</p></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function mockFetchOnce(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({ status, ok: status < 400, json: () => Promise.resolve(body) });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const authBody = { user: { id: "u1", email: "alice@example.test" }, token: "jwt-abc" };

describe("authentification dans React", () => {
  test("sans session, une page privée redirige vers la connexion", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(screen.queryByText("Page privée")).not.toBeInTheDocument();
  });

  test("connexion réussie : JWT stocké et accès à la page privée", async () => {
    const fetchMock = mockFetchOnce(200, authBody);
    renderAt("/login");
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.test");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "MotDePasse123!");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByText("Page privée")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("jwt-abc");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/login");
  });

  test("connexion refusée : message de l'API affiché", async () => {
    mockFetchOnce(401, { error: { code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" } });
    renderAt("/login");
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.test");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou mot de passe incorrect");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("inscription : mots de passe différents refusés avant tout appel", async () => {
    const fetchMock = mockFetchOnce(201, authBody);
    renderAt("/register");
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.test");
    await userEvent.type(screen.getByLabelText("Mot de passe (8 caractères minimum)"), "MotDePasse123!");
    await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "Autre123!");
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(screen.getByRole("alert")).toHaveTextContent("ne correspondent pas");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("inscription réussie : envoie seulement email et mot de passe", async () => {
    const fetchMock = mockFetchOnce(201, authBody);
    renderAt("/register");
    await userEvent.type(screen.getByLabelText("Email"), "alice@example.test");
    await userEvent.type(screen.getByLabelText("Mot de passe (8 caractères minimum)"), "MotDePasse123!");
    await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "MotDePasse123!");
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(await screen.findByText("Page privée")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: "alice@example.test",
      password: "MotDePasse123!",
    });
  });
});
