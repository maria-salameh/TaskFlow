import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../hooks/useAuth.js"; 
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth(); 

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        // Login logic here
        try {
            await login(email, password);
            // Redirect or update UI after successful login
            navigate('/'); // Page d'accueil = mes tâches
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
      <div className="auth-page">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Login</h2>
          {error && <ErrorMessage message={error} />}
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
          <p className="switch">
            No account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>
    );
}    