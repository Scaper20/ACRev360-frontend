import { apiClient, errorMessage } from '@acrev360/api';

export type QueueRecordType = 'PAYMENT' | 'PAYER';
export type QueueOutcome = 'PENDING' | 'ACCEPTED' | 'CONFLICT' | 'REJECTED';

export interface QueueItem {
  client_id: string;
  entity_type: QueueRecordType;
  payload: Record<string, unknown>;
  /** Short human label for the queue bar/status list, e.g. "₦5,000 — John Doe"
   * — computed once at enqueue time so rendering the queue never needs the
   * original payer/bill objects still in memory. */
  description: string;
  queued_at: string;
  outcome: QueueOutcome;
  result_ref?: string;
  detail?: Record<string, unknown>;
}

const QUEUE_KEY = 'acrev360_field_queue';
const LAST_SYNC_KEY = 'acrev360_field_last_sync';
const listeners = new Set<() => void>();

export function getLastSyncAt(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function onQueueChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  notify();
}

export function enqueue(entityType: QueueRecordType, payload: Record<string, unknown>, description: string): QueueItem {
  const item: QueueItem = {
    client_id: crypto.randomUUID(),
    entity_type: entityType,
    payload,
    description,
    queued_at: new Date().toISOString(),
    outcome: 'PENDING',
  };
  saveQueue([...loadQueue(), item]);
  return item;
}

/** Removes one item outright — used once the agent has seen and
 * acknowledged a CONFLICT/REJECTED outcome; a PENDING item is never removed
 * this way (only a successful sync or an explicit re-attempt resolves it). */
export function dismissQueueItem(clientId: string): void {
  saveQueue(loadQueue().filter((item) => item.client_id !== clientId));
}

export interface SyncSummary {
  accepted: number;
  conflicts: number;
  rejected: number;
}

/** Posts every PENDING item as one batch to POST /mobile/sync. ACCEPTED
 * items are removed from the queue entirely; CONFLICT/REJECTED items stay,
 * tagged with their outcome and detail, until dismissQueueItem() clears
 * them — the agent should see what didn't go through, not have it silently
 * vanish. A network-level failure (offline, timeout) leaves every item
 * PENDING and untouched, safe to retry later. */
export async function syncQueue(): Promise<SyncSummary> {
  const queue = loadQueue();
  const pending = queue.filter((item) => item.outcome === 'PENDING');
  if (pending.length === 0) return { accepted: 0, conflicts: 0, rejected: 0 };

  const { data, error } = await apiClient.POST('/api/v1/mobile/sync', {
    body: {
      records: pending.map((item) => ({
        client_id: item.client_id,
        entity_type: item.entity_type,
        payload: item.payload,
      })),
    },
  });
  if (error) throw new Error(errorMessage(error));

  const outcomeByClientId = new Map<string, { outcome: QueueOutcome; result_ref: string; detail: Record<string, unknown> }>();
  for (const row of data.accepted) outcomeByClientId.set(row.client_id, { outcome: 'ACCEPTED', result_ref: row.result_ref, detail: row.detail });
  for (const row of data.conflicts) outcomeByClientId.set(row.client_id, { outcome: 'CONFLICT', result_ref: row.result_ref, detail: row.detail });
  for (const row of data.rejected) outcomeByClientId.set(row.client_id, { outcome: 'REJECTED', result_ref: row.result_ref, detail: row.detail });

  const updated = queue
    .map((item) => {
      const outcome = outcomeByClientId.get(item.client_id);
      return outcome ? { ...item, ...outcome } : item;
    })
    .filter((item) => item.outcome !== 'ACCEPTED');
  saveQueue(updated);
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  return { accepted: data.accepted.length, conflicts: data.conflicts.length, rejected: data.rejected.length };
}
