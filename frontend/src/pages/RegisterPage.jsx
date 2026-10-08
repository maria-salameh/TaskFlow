import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import AuthAside from "../components/AuthAside.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    // Aide à la saisie uniquement : l'API revalide (email, 8 caractères minimum)
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Inscription impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthAside />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1>Créer un compte</h1>
        <p className="auth-lead">Un email et un mot de passe suffisent.</p>
        <ErrorMessage message={error} />
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="register-password">Mot de passe (8 caractères minimum)</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <label htmlFor="register-confirm">Confirmer le mot de passe</label>
        <input
          id="register-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
        <p className="switch">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
