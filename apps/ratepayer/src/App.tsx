import { useState } from 'react';
import './App.css';
import { useAuth } from './auth/AuthContext';
import { BillsView } from './views/BillsView';
import { DelegationsView } from './views/DelegationsView';
import { LoginScreen } from './views/LoginScreen';
import { PaymentsView } from './views/PaymentsView';
import { ReceiptsView } from './views/ReceiptsView';

type Tab = 'bills' | 'payments' | 'receipts' | 'delegations';

export function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-40)' }}>Loading…</div>;
  }
  if (!user) return <LoginScreen onLogin={login} />;
  return <AuthenticatedApp fullName={user.full_name} isRatepayer={user.access_level === 'RATEPAYER'} onLogout={logout} />;
}

function AuthenticatedApp({ fullName, isRatepayer, onLogout }: { fullName: string; isRatepayer: boolean; onLogout: () => Promise<void> }) {
  const [tab, setTab] = useState<Tab>('bills');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'bills', label: 'Bills' },
    { key: 'payments', label: 'Payments' },
    { key: 'receipts', label: 'Receipts' },
    // Delegation management is RATEPAYER-only — a proxy can't grant further
    // proxies (confirmed live: POST/GET /my/delegations 403s for
    // RATEPAYER_PROXY, matching "ratepayer explicitly grants/revokes").
    ...(isRatepayer ? [{ key: 'delegations' as const, label: 'Manage Access' }] : []),
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--canvas)' }}>
      <header className="rp-header">
        <div className="rp-header-brand">
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--green-800)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            AC
          </div>
          <div className="rp-header-name">My ACRev360 Account</div>
        </div>
        <div className="rp-header-user">
          <span className="rp-header-fullname">{fullName}</span>
          <button className="btn btn-ghost" onClick={() => onLogout()}>
            Sign out
          </button>
        </div>
      </header>

      {/* Primary nav for the whole app — full .btn size, not .btn-sm, since
          this is the single most-used control here and likely tapped from a
          phone (WCAG target-size floor is 24px; .btn-sm sits closer to that
          floor than a primary nav should). */}
      <nav style={{ display: 'flex', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--surface)', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        {tab === 'bills' ? <BillsView /> : tab === 'payments' ? <PaymentsView /> : tab === 'receipts' ? <ReceiptsView /> : <DelegationsView />}
      </main>
    </div>
  );
}
