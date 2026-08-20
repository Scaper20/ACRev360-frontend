import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const postMock = vi.fn();
vi.mock('@acrev360/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acrev360/api')>()),
  apiClient: { POST: (...args: unknown[]) => postMock(...args) },
}));

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    postMock.mockReset();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('enqueue adds a PENDING item with a generated client_id', async () => {
    const { enqueue, loadQueue } = await import('./offlineQueue');
    const item = enqueue('PAYMENT', { bill_id: 1, amount: '5000' }, '₦5,000 — Test Payer');
    expect(item.outcome).toBe('PENDING');
    expect(item.client_id).toBeTruthy();
    expect(loadQueue()).toHaveLength(1);
    expect(loadQueue()[0].description).toBe('₦5,000 — Test Payer');
  });

  it('dismissQueueItem removes only the targeted item', async () => {
    const { enqueue, dismissQueueItem, loadQueue } = await import('./offlineQueue');
    const a = enqueue('PAYMENT', { bill_id: 1 }, 'A');
    const b = enqueue('PAYMENT', { bill_id: 2 }, 'B');
    dismissQueueItem(a.client_id);
    const remaining = loadQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].client_id).toBe(b.client_id);
  });

  it('syncQueue with an empty queue makes no request and reports zero counts', async () => {
    const { syncQueue } = await import('./offlineQueue');
    const summary = await syncQueue();
    expect(summary).toEqual({ accepted: 0, conflicts: 0, rejected: 0 });
    expect(postMock).not.toHaveBeenCalled();
  });

  it('syncQueue removes accepted items and keeps conflict/rejected ones tagged with their outcome', async () => {
    const { enqueue, syncQueue, loadQueue, getLastSyncAt } = await import('./offlineQueue');
    const accepted = enqueue('PAYMENT', { bill_id: 1 }, 'Accepted one');
    const conflicted = enqueue('PAYER', { full_name: 'Dup' }, 'Conflicted one');
    const rejected = enqueue('PAYMENT', { bill_id: 999 }, 'Rejected one');

    postMock.mockResolvedValue({
      data: {
        accepted: [{ client_id: accepted.client_id, result_ref: 'PAY-1', detail: {} }],
        conflicts: [{ client_id: conflicted.client_id, result_ref: '', detail: { error: 'duplicate' } }],
        rejected: [{ client_id: rejected.client_id, result_ref: '', detail: { error: 'bad bill' } }],
      },
      error: undefined,
    });

    const summary = await syncQueue();
    expect(summary).toEqual({ accepted: 1, conflicts: 1, rejected: 1 });

    const remaining = loadQueue();
    expect(remaining).toHaveLength(2);
    expect(remaining.find((i) => i.client_id === accepted.client_id)).toBeUndefined();
    const stillConflicted = remaining.find((i) => i.client_id === conflicted.client_id);
    expect(stillConflicted?.outcome).toBe('CONFLICT');
    expect(stillConflicted?.detail).toEqual({ error: 'duplicate' });
    expect(getLastSyncAt()).toBeTruthy();
  });

  it('syncQueue throws and leaves the queue untouched when the request itself fails', async () => {
    const { enqueue, syncQueue, loadQueue } = await import('./offlineQueue');
    enqueue('PAYMENT', { bill_id: 1 }, 'Still pending');
    postMock.mockResolvedValue({ data: undefined, error: { error: 'network down' } });

    await expect(syncQueue()).rejects.toThrow('network down');
    expect(loadQueue()).toHaveLength(1);
    expect(loadQueue()[0].outcome).toBe('PENDING');
  });
});
