import { apiClient } from '@acrev360/api';
import { Button, money2 } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import type { QueueItem } from '../lib/offlineQueue';
import { dismissQueueItem, getLastSyncAt, loadQueue, onQueueChange, syncQueue } from '../lib/offlineQueue';

export function StatusView({
  agentId,
  agentName,
  wardName,
  isOnline,
}: {
  agentId: number | null;
  agentName: string;
  wardName: string | null;
  isOnline: boolean;
}) {
  const [queue, setQueue] = useState<QueueItem[]>(loadQueue());
  const [todayTotal, setTodayTotal] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(getLastSyncAt);

  useEffect(() => onQueueChange(() => setQueue(loadQueue())), []);

  useEffect(() => {
    if (!isOnline || agentId == null) return;
    apiClient
      .GET('/api/v1/agents/{id}/activity', { params: { path: { id: String(agentId) } } })
      .then(({ data, error }) => {
        if (!error) setTodayTotal(data.today_total);
      })
      .catch(() => {
        // Status simply shows nothing for today's tally offline — the
        // queue/sync section below is the part that actually matters then.
      });
  }, [isOnline, agentId]);

  const pending = queue.filter((item) => item.outcome === 'PENDING');
  const needsAttention = queue.filter((item) => item.outcome !== 'PENDING');

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const summary = await syncQueue();
      setLastSyncAt(getLastSyncAt());
      setSyncMessage(`Synced — ${summary.accepted} accepted, ${summary.conflicts} conflicts, ${summary.rejected} rejected`);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed — still queued locally');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="field-card">
        <div className="field-kv">
          <span>Agent</span>
          <b>{agentName}</b>
        </div>
        <div className="field-kv">
          <span>Ward</span>
          <b>{wardName ?? 'Not assigned'}</b>
        </div>
        <div className="field-kv">
          <span>Today's collections</span>
          <b className="num">{todayTotal != null ? money2(todayTotal) : isOnline ? '…' : '—'}</b>
        </div>
      </div>

      <div className="field-card">
        <div className="field-kv">
          <span>Queued records</span>
          <b>{pending.length}</b>
        </div>
        <div className="field-kv">
          <span>Last synced</span>
          <b>{lastSyncAt ? new Date(lastSyncAt).toLocaleString('en-NG') : 'Never'}</b>
        </div>
        <Button variant="primary" style={{ width: '100%', marginTop: 10 }} disabled={syncing || pending.length === 0 || !isOnline} onClick={handleSync}>
          {syncing ? 'Syncing…' : !isOnline ? 'Offline — will sync automatically' : `Sync now (${pending.length})`}
        </Button>
        {syncMessage != null && <p style={{ fontSize: 12, color: 'var(--ink-40)', marginTop: 8 }}>{syncMessage}</p>}
      </div>

      {needsAttention.length > 0 && (
        <div className="field-card">
          <b style={{ fontSize: 13 }}>Needs attention</b>
          {needsAttention.map((item) => (
            <div key={item.client_id} className="field-queue-item">
              <div>
                <div>{item.description}</div>
                <div className="tag-bad">
                  {item.outcome === 'CONFLICT' ? 'Conflict' : 'Rejected'}
                  {item.detail?.error ? `: ${String(item.detail.error)}` : ''}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => dismissQueueItem(item.client_id)} type="button">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="field-card">
          <b style={{ fontSize: 13 }}>Waiting to sync</b>
          {pending.map((item) => (
            <div key={item.client_id} className="field-queue-item">
              <div>{item.description}</div>
              <span style={{ color: 'var(--ink-40)', fontSize: 11 }}>{item.entity_type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
