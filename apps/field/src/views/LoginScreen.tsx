import { Button, Field, Input, Notice } from '@acrev360/ui';
import { useState } from 'react';
import './LoginScreen.css';

// seed_demo_data creates agent01..08 (see apps/tenancy/management/commands/
// seed_demo_data.py's _seed_agents) — same shared demo password as the
// portal's own admin/consultant1/stakeholder accounts.
const DEMO_PASSWORD = 'acrev360-2026';
const DEMO_USERNAME = 'agent01';

export function LoginScreen({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function attemptLogin(u: string, p: string) {
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(u, p);
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

  function quickLogin() {
    setUsername(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    void attemptLogin(DEMO_USERNAME, DEMO_PASSWORD);
  }

  return (
    <div className="field-login">
      <div className="field-login-card">
        <div className="field-login-mark">AC</div>
        <h1>ACRev360 Field</h1>
        <p>Sign in with your field agent account.</p>
        <form onSubmit={handleSubmit}>
          {error != null && <Notice variant="bad">{error}</Notice>}
          <Field label="Username" htmlFor="fu">
            <Input id="fu" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Password" htmlFor="fp">
            <Input id="fp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Button variant="primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 6 }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <button type="button" className="field-demo-login" disabled={submitting} onClick={quickLogin}>
          Try the demo agent account
        </button>
      </div>
    </div>
  );
}
