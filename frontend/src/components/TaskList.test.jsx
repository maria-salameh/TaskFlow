import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import TaskList from "./TaskList.jsx";

const tasks = [
  { id: "1", title: "Préparer la démo", status: "todo", priority: "high", description: "Plan", dueDate: null },
  { id: "2", title: "Swagger", status: "done", priority: "low", description: "", dueDate: "2026-10-04" },
];

function renderList(props = {}) {
  const handlers = { onUpdate: vi.fn().mockResolvedValue({}), onDelete: vi.fn().mockResolvedValue(), onRetry: vi.fn() };
  render(<TaskList tasks={tasks} loading={false} error={null} {...handlers} {...props} />);
  return handlers;
}

describe("<TaskList />", () => {
  test("état de chargement", () => {
    renderList({ loading: true });
    expect(screen.getByRole("status")).toHaveTextContent("Chargement");
  });

  test("état vide avec message personnalisé", () => {
    renderList({ tasks: [], emptyMessage: "Rien ici" });
    expect(screen.getByText("Rien ici")).toBeInTheDocument();
  });

  test("état d'erreur avec bouton Réessayer", async () => {
    const { onRetry } = renderList({ error: "Impossible de joindre l'API" });
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de joindre l'API");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalled();
  });

  test("affiche chaque tâche avec sa priorité et son échéance", () => {
    renderList();
    const items = within(screen.getByRole("list", { name: "Liste des tâches" })).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Haute");
    expect(items[0]).toHaveTextContent("Sans échéance");
    expect(items[1]).toHaveTextContent("4 oct. 2026");
  });

  test("changer le statut appelle onUpdate avec un PATCH partiel", async () => {
    const { onUpdate } = renderList();
    await userEvent.selectOptions(screen.getByLabelText("Statut de « Préparer la démo »"), "doing");
    expect(onUpdate).toHaveBeenCalledWith("1", { status: "doing" });
  });

  test("supprimer demande confirmation", async () => {
    const { onDelete } = renderList();
    const confirm = vi.spyOn(window, "confirm");

    confirm.mockReturnValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer « Swagger »" }));
    expect(onDelete).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer « Swagger »" }));
    expect(onDelete).toHaveBeenCalledWith("2");
  });

  test("modifier ouvre le formulaire prérempli", async () => {
    const { onUpdate } = renderList();
    await userEvent.click(screen.getByRole("button", { name: "Modifier « Swagger »" }));
    const title = screen.getByDisplayValue("Swagger");
    await userEvent.clear(title);
    await userEvent.type(title, "Swagger à jour");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(onUpdate).toHaveBeenCalledWith("2", expect.objectContaining({ title: "Swagger à jour", status: "done" }));
  });
});
