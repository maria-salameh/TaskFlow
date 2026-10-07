// Les échéances et les réalisations sont des dates civiles "YYYY-MM-DD" : on les
// manipule en heure locale pour éviter les décalages d'un jour dus au fuseau horaire.

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// addDays("2026-10-31", 1) -> "2026-11-01" (gère mois, années, changements d'heure)
export function addDays(key, days) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// Lundi de la semaine contenant la date (semaines du lundi au dimanche)
export function startOfWeek(key) {
  const date = parseDateKey(key);
  const offset = (date.getDay() + 6) % 7; // lundi = 0 ... dimanche = 6
  return addDays(key, -offset);
}

// Fuseau horaire IANA du navigateur (ex. "Europe/Paris"), envoyé à l'API pour la heatmap
export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

// "mercredi 7 octobre 2026" -> "Mercredi 7 octobre 2026"
export function formatLongDateKey(key) {
  const label = parseDateKey(key).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateKey(key) {
  if (!key) return "";
  return parseDateKey(key).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
