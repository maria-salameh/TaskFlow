// Les échéances sont des dates civiles "YYYY-MM-DD" : on les manipule
// en heure locale pour éviter les décalages d'un jour dus au fuseau horaire.

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

// "mercredi 7 octobre 2026" -> "Mercredi 7 octobre 2026"
export function formatLongDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateKey(key) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
