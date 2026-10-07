import { useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";
import { PRIORITY_LABELS, STATUS_LABELS } from "../services/taskServices.js";
import { validateTaskForm } from "../utils/taskValidation.js";

const EMPTY_TASK = { title: "", status: "todo", priority: "medium", description: "", dueDate: "" };

// Formulaire de création OU de modification (si initialTask est fourni).
export default function TaskForm({ initialTask, onSubmit, onCancel }) {
  const isEdit = Boolean(initialTask);
  const [values, setValues] = useState(() =>
    initialTask
      ? {
          title: initialTask.title,
          status: initialTask.status,
          priority: initialTask.priority ?? "medium",
          description: initialTask.description ?? "",
          dueDate: initialTask.dueDate ?? "",
        }
      : EMPTY_TASK,
  );
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateTaskForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: values.title.trim(),
      status: values.status,
      priority: values.priority,
      description: values.description,
      dueDate: values.dueDate || null,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      if (!isEdit) {
        setValues(EMPTY_TASK);
        setSuccess("Tâche ajoutée.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const idPrefix = isEdit ? `edit-${initialTask.id}` : "new";

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate aria-label={isEdit ? "Modifier la tâche" : "Nouvelle tâche"}>
      {!isEdit && <h2>Nouvelle tâche</h2>}
      <ErrorMessage message={error} />
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}

      <label htmlFor={`${idPrefix}-title`}>Titre *</label>
      <input
        id={`${idPrefix}-title`}
        name="title"
        value={values.title}
        onChange={handleChange}
        maxLength={120}
        required
        placeholder="Ex. Préparer la démo"
      />

      <div className="form-row">
        <div>
          <label htmlFor={`${idPrefix}-status`}>Statut *</label>
          <select id={`${idPrefix}-status`} name="status" value={values.status} onChange={handleChange}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-priority`}>Priorité</label>
          <select id={`${idPrefix}-priority`} name="priority" value={values.priority} onChange={handleChange}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor={`${idPrefix}-dueDate`}>Échéance</label>
      <input id={`${idPrefix}-dueDate`} type="date" name="dueDate" value={values.dueDate} onChange={handleChange} />

      <label htmlFor={`${idPrefix}-description`}>Description</label>
      <textarea
        id={`${idPrefix}-description`}
        name="description"
        value={values.description}
        onChange={handleChange}
        maxLength={1000}
        rows={3}
        placeholder="Facultatif"
      />
      <p className="hint">{values.description.length}/1000</p>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter la tâche"}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
