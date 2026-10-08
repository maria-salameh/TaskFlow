import BrandMark from "./BrandMark.jsx";

// Panneau de présentation affiché à côté des formulaires de connexion et d'inscription
export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <p className="auth-brand">
        <BrandMark size={34} />
        <span>TaskFlow</span>
      </p>
      <p className="auth-pitch">Notez ce qu'il reste à faire. Cochez ce qui est fait.</p>
      <ul className="auth-sample" aria-hidden="true">
        <li className="is-done">Rendre le TP 6</li>
        <li className="is-doing">Relire le cours sur les JWT</li>
        <li>Préparer la soutenance</li>
      </ul>
      <p className="auth-note">Vos tâches restent privées : personne d'autre ne peut les voir.</p>
    </aside>
  );
}
