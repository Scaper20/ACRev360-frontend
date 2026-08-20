import { Button, Field, Input, Notice } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

// Matches `seed_demo_data`'s "Sign-in accounts" printout — kept in sync by
// hand since there's no endpoint that lists what demo accounts exist.
const DEMO_PASSWORD = 'acrev360-2026';
const DEMO_ACCOUNTS = [
  { username: 'admin', label: 'Council Revenue Administrator — full access' },
  { username: 'consultant1', label: 'Sub-consultant manager — own portfolio only' },
  { username: 'stakeholder', label: 'Council stakeholder — read-only, general figures only' },
];

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

  async function attemptLogin(u: string, p: string) {
    setError(null);
    setSubmitting(true);
    try {
      await login(u, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void attemptLogin(username, password);
  }

  // Demo credentials seeded by `seed_demo_data` — see DEMO_ACCOUNTS below.
  // Fills the visible fields (so it's obvious what's signing in, not just a
  // silent teleport past the form) and submits with the explicit values
  // rather than the just-set state, which wouldn't be readable yet.
  function quickLogin(u: string) {
    setUsername(u);
    setPassword(DEMO_PASSWORD);
    void attemptLogin(u, DEMO_PASSWORD);
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

          <div className="demo-accounts">
            <h4>Demonstration accounts</h4>
            {DEMO_ACCOUNTS.map((acct) => (
              <button key={acct.username} type="button" disabled={submitting} onClick={() => quickLogin(acct.username)}>
                <b>{acct.username}</b>
                <small>{acct.label}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
