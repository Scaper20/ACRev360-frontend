import type { WorklistPayer } from '@acrev360/api';
import { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { FieldShell } from './components/FieldShell';
import type { FieldView } from './components/FieldShell';
import { MyProfileModal } from './components/MyProfileModal';
import { LoginScreen } from './views/LoginScreen';
import { CollectView } from './views/CollectView';
import type { ReceiptResult } from './views/ReceiptView';
import { ReceiptView } from './views/ReceiptView';
import { RegisterView } from './views/RegisterView';
import { StatusView } from './views/StatusView';
import { WorklistView } from './views/WorklistView';
import { loadQueue, onQueueChange, syncQueue } from './lib/offlineQueue';

export function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-40)' }}>Loading…</div>
    );
  }
  if (!user) return <LoginScreen onLogin={login} />;
  return (
    <AuthenticatedApp
      agentId={user.agent_id}
      agentName={user.full_name}
      wardId={user.assigned_ward_id}
      wardName={user.assigned_ward_name}
      onLogout={logout}
    />
  );
}

function AuthenticatedApp({
  agentId,
  agentName,
  wardId,
  wardName,
  onLogout,
}: {
  agentId: number | null;
  agentName: string;
  wardId: number | null;
  wardName: string | null;
  onLogout: () => Promise<void>;
}) {
  const [view, setView] = useState<FieldView>('worklist');
  const [selectedPayer, setSelectedPayer] = useState<WorklistPayer | null>(null);
  const [receipt, setReceipt] = useState<ReceiptResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(loadQueue().length);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
      syncQueue().catch(() => {
        // A failed auto-sync on reconnect isn't surfaced here — Status view
        // shows the queue as still-pending either way, and the agent can
        // retry manually from there.
      });
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => onQueueChange(() => setQueueCount(loadQueue().length)), []);

  function handleNavigate(next: FieldView) {
    setReceipt(null);
    setView(next);
  }

  function handleSelectPayer(payer: WorklistPayer) {
    setSelectedPayer(payer);
    setReceipt(null);
    setView('collect');
  }

  function handleReceipt(result: ReceiptResult) {
    setReceipt(result);
  }

  function handleReceiptDone() {
    setReceipt(null);
    setSelectedPayer(null);
    setView('worklist');
  }

  return (
    <>
      <FieldShell
        agentName={agentName}
        wardName={wardName}
        isOnline={isOnline}
        queueCount={queueCount}
        activeView={view}
        onNavigate={handleNavigate}
        onSignOut={onLogout}
        onProfileClick={() => setProfileOpen(true)}
      >
        {receipt ? (
          <ReceiptView receipt={receipt} onDone={handleReceiptDone} />
        ) : view === 'worklist' ? (
          <WorklistView onSelectPayer={handleSelectPayer} />
        ) : view === 'collect' ? (
          <CollectView payer={selectedPayer} isOnline={isOnline} onBack={() => setView('worklist')} onReceipt={handleReceipt} />
        ) : view === 'register' ? (
          <RegisterView wardId={wardId} isOnline={isOnline} onReceipt={handleReceipt} />
        ) : (
          <StatusView agentId={agentId} agentName={agentName} wardName={wardName} isOnline={isOnline} />
        )}
      </FieldShell>
      {profileOpen && <MyProfileModal onClose={() => setProfileOpen(false)} />}
    </>
  );
}
