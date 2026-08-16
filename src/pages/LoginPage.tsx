import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";

export function LoginPage() {
  const { login, isAuthenticated, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  }

  return (
    <div className="login-screen">
      <div className="login-brand">
        <span className="login-wordmark display">ACRev360</span>
        <p className="login-tagline">Revenue Administration &amp; Collection</p>
      </div>
      <div className="login-panel">
        <form className="login-form card" onSubmit={handleSubmit}>
          <h1 className="display">Sign in</h1>
          {error && <div className="error-banner">{error}</div>}
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
