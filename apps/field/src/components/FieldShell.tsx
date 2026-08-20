import type { ReactNode } from 'react';
import './FieldShell.css';

export type FieldView = 'worklist' | 'collect' | 'register' | 'status';

const NAV: { key: FieldView; label: string; icon: string }[] = [
  { key: 'worklist', label: 'Worklist', icon: '☰' },
  { key: 'collect', label: 'Collect', icon: '₦' },
  { key: 'register', label: 'Register', icon: '+' },
  { key: 'status', label: 'Status', icon: '◔' },
];

export function FieldShell({
  agentName,
  wardName,
  isOnline,
  queueCount,
  activeView,
  onNavigate,
  onSignOut,
  children,
}: {
  agentName: string;
  wardName: string | null;
  isOnline: boolean;
  queueCount: number;
  activeView: FieldView;
  onNavigate: (view: FieldView) => void;
  onSignOut: () => void;
  children: ReactNode;
}) {
  return (
    <div className="field-shell">
      <header className="field-header">
        <div className="field-header-who">
          <div className="field-avatar">{agentName.slice(0, 2).toUpperCase()}</div>
          <div>
            <b>{agentName}</b>
            <small>{wardName ?? 'No ward assigned'}</small>
          </div>
        </div>
        <div className={`field-online-badge ${isOnline ? 'on' : 'off'}`}>{isOnline ? 'Online' : 'Offline'}</div>
        <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {queueCount > 0 && (
        <button className="field-queue-bar" onClick={() => onNavigate('status')}>
          {queueCount} record{queueCount === 1 ? '' : 's'} queued — {isOnline ? 'tap to sync' : 'will sync when online'}
        </button>
      )}

      <main className="field-page">{children}</main>

      <nav className="field-bottom-nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={item.key === activeView ? 'active' : undefined}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            <span className="field-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
