import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import TaskForm from "./TaskForm.jsx";
import { validateTaskForm } from "../utils/taskValidation.js";

describe("validateTaskForm", () => {
  const base = { title: "T", description: "" };
  test("titre obligatoire (après trim) et longueurs maximales", () => {
    expect(validateTaskForm({ ...base, title: "   " })).toMatch(/obligatoire/);
    expect(validateTaskForm({ ...base, title: "x".repeat(121) })).toMatch(/120/);
    expect(validateTaskForm({ ...base, description: "x".repeat(1001) })).toMatch(/1000/);
    expect(validateTaskForm(base)).toBeNull();
  });
});

describe("<TaskForm />", () => {
  test("titre vide : message d'erreur et aucun envoi", async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter la tâche" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Le titre est obligatoire.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("envoie un objet conforme au contrat puis vide le formulaire", async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<TaskForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Titre *"), "  Préparer la démo  ");
    await userEvent.selectOptions(screen.getByLabelText("Statut *"), "doing");
    await userEvent.selectOptions(screen.getByLabelText("Priorité"), "high");
    await userEvent.type(screen.getByLabelText("Description"), "Plan");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter la tâche" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Préparer la démo",
      status: "doing",
      priority: "high",
      description: "Plan",
      dueDate: null, // date vide => null, comme attendu par l'API
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Tâche ajoutée.");
    expect(screen.getByLabelText("Titre *")).toHaveValue("");
  });

  test("affiche le message d'erreur renvoyé par l'API", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Le statut doit être todo, doing ou done"));
    render(<TaskForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Titre *"), "T");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter la tâche" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Le statut doit être todo, doing ou done");
  });

  test("mode édition : préremplit et propose Annuler", async () => {
    const onCancel = vi.fn();
    render(
      <TaskForm
        initialTask={{ id: "1", title: "Existante", status: "done", priority: "low", description: "", dueDate: "2026-10-05" }}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByLabelText("Titre *")).toHaveValue("Existante");
    expect(screen.getByLabelText("Échéance")).toHaveValue("2026-10-05");
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
