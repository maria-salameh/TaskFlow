import { useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";
import { FREQUENCY_LABELS } from "../services/habitServices.js";

// Création ou modification d'une habitude (titre + fréquence)
export default function HabitForm({ initialHabit, onSubmit, onCancel }) {
  const isEdit = Boolean(initialHabit);
  const [title, setTitle] = useState(initialHabit?.title ?? "");
  const [frequency, setFrequency] = useState(initialHabit?.frequency ?? "daily");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const idPrefix = isEdit ? `habit-${initialHabit.id}` : "new-habit";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), frequency });
      if (!isEdit) setTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="habit-form" onSubmit={handleSubmit} noValidate aria-label={isEdit ? "Modifier l'habitude" : "Nouvelle habitude"}>
      <ErrorMessage message={error} />
      <div className="habit-form-row">
        <div className="habit-form-title">
          <label htmlFor={`${idPrefix}-title`}>{isEdit ? "Titre" : "Nouvelle habitude"}</label>
          <input
            id={`${idPrefix}-title`}
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Marcher 30 minutes"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-frequency`}>Fréquence</label>
          <select id={`${idPrefix}-frequency`} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {isEdit ? "Enregistrer" : "Ajouter"}
          </button>
          {onCancel && (
            <button type="button" className="btn" onClick={onCancel}>
              Annuler
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
