import { useState } from 'react';
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
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
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
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>My ACRev360 Account</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-60)' }}>{fullName}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onLogout()}>
            Sign out
          </button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 4, padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
        {TABS.map((t) => (
          <button key={t.key} className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t.key)}>
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
