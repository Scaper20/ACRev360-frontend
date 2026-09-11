import { Button, Field, Input, Notice } from '@acrev360/ui';
import { useState } from 'react';
import './LoginScreen.css';

export function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function attemptLogin(e: string, p: string) {
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(e, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void attemptLogin(email, password);
  }

  return (
    <div className="rp-login">
      <div className="rp-login-card">
        <div className="rp-login-mark">AC</div>
        <h1>My ACRev360 Account</h1>
        <p>Sign in to view your bills, payments and receipts.</p>
        <form onSubmit={handleSubmit}>
          {error != null && <Notice variant="bad">{error}</Notice>}
          <Field label="Email" htmlFor="re">
            <Input id="re" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </Field>
          <Field label="Password" htmlFor="rp">
            <Input id="rp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Button variant="primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: 6 }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
