import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth.js"; 
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await register(email, name, password);
            navigate("/");
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setSubmitting(false);
        }
    }

    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Create your account</h1>
          {error && <ErrorMessage message={error} />}
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Sign up"}
          </button>
          {/* Lien pour ceux qui ont déjà un compte. */}
          <p className="switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    );
}
