// Valide le formulaire de tâche côté navigateur pour aider l'utilisateur.
// Ne protège pas l'API : le serveur refait toutes ces vérifications
// (backend/src/validators/taskValidator.js).
export function validateTaskForm(values) {
  const title = values.title.trim();
  if (!title) return "Le titre est obligatoire.";
  if (title.length > 120) return "Le titre doit faire au plus 120 caractères.";
  if (values.description.length > 1000) return "La description doit faire au plus 1000 caractères.";
  return null;
}
