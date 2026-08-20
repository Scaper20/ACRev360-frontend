import type { WorklistPayer } from '@acrev360/api';
import { apiClient, errorMessage } from '@acrev360/api';
import { money2 } from '@acrev360/ui';
import { useEffect, useState } from 'react';
import { cacheWorklist, getCachedWorklist } from '../lib/fieldCache';

export function WorklistView({ onSelectPayer }: { onSelectPayer: (payer: WorklistPayer) => void }) {
  const [payers, setPayers] = useState<WorklistPayer[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .GET('/api/v1/mobile/worklist', { params: { query: { q: q || undefined } } })
      .then(({ data, error: apiError }) => {
        if (cancelled) return;
        if (apiError) throw new Error(errorMessage(apiError));
        setPayers(data.results);
        setFromCache(false);
        setError(null);
        if (!q) cacheWorklist(data.results);
      })
      .catch((err) => {
        if (cancelled) return;
        // Offline or unreachable: fall back to the last successful fetch
        // rather than showing a dead error screen — a search query has
        // nothing to fall back to (it was never cached), so only do this
        // for the unfiltered worklist.
        const cached = !q ? getCachedWorklist() : null;
        if (cached) {
          setPayers(cached.payers);
          setFromCache(true);
          setError(null);
        } else {
          setPayers([]);
          setError(err instanceof Error ? err.message : 'Could not load worklist');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div>
      <input
        className="field-search"
        placeholder="Search by name or reference…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
        style={{ width: '100%', marginBottom: 12 }}
      />

      {fromCache && (
        <div className="notice notice-info" style={{ marginBottom: 10, fontSize: 12 }}>
          Showing your last downloaded worklist — offline.
        </div>
      )}
      {error != null && (
        <div className="notice notice-bad" style={{ marginBottom: 10, fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--ink-40)', fontSize: 13 }}>Loading…</p>
      ) : payers.length === 0 ? (
        <p style={{ color: 'var(--ink-40)', fontSize: 13 }}>{q ? 'No payers match' : 'No payers in your ward yet'}</p>
      ) : (
        payers.map((payer) => (
          <button key={payer.id} className="field-payer-card" onClick={() => onSelectPayer(payer)} type="button">
            <div className="field-payer-avatar">{payer.full_name.slice(0, 2).toUpperCase()}</div>
            <div className="field-payer-info">
              <b>{payer.full_name}</b>
              <small>{payer.payer_ref}</small>
            </div>
            <div className="field-payer-balance">{Number(payer.outstanding) > 0 ? money2(payer.outstanding) : 'Cleared'}</div>
          </button>
        ))
      )}
    </div>
  );
}
