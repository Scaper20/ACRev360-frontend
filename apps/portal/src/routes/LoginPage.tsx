import { Button, Field, Input, Notice } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirecting must happen in an effect, not the render body — calling
  // navigate() directly while rendering violates React's rules ("Cannot
  // update a component while rendering a different component") and showed
  // up as a real console error the first time this path was exercised live.
  useEffect(() => {
    if (!user) return;
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
    navigate(from, { replace: true });
  }, [user, location.state, navigate]);

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="login">
      <div className="login-brand">
        <div>
          <h1>
            Every naira billed,
            <br />
            collected, receipted
            <br />
            and reconciled.
          </h1>
          <p>The unified revenue platform for FCT Area Councils — enumeration through to enforcement, with every sub-consultant on one accountable system.</p>
        </div>
        <div className="channels">
          <span>POS Terminals</span>
          <span>Branch Teller</span>
          <span>Internet &amp; Mobile Banking</span>
          <span>USSD</span>
          <span>Agent Banking</span>
        </div>
      </div>
      <div className="login-form">
        <div className="login-card">
          <h2>Sign in</h2>
          <p style={{ marginBottom: 20, color: 'var(--ink-60)', fontSize: 13 }}>Use your Council or sub-consultant credentials.</p>
          <form onSubmit={handleSubmit}>
            {error != null && <Notice variant="bad">{error}</Notice>}
            <Field label="Username" htmlFor="u">
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </Field>
            <Field label="Password" htmlFor="p">
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Button variant="primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 6 }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
