import { apiClient, errorMessage } from '@acrev360/api';
import type { ApiClientCreateResponse } from '@acrev360/api';
import { Button, Field, KV, Modal, Notice, Select, Tag, dateTime, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const SCOPE_LABEL: Record<string, string> = { 'payments.webhook.post': 'Post payment webhooks' };

function isExpired(expiresAt: string | null | undefined): boolean {
  return expiresAt != null && new Date(expiresAt) <= new Date();
}

export function ChannelsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [channelId, setChannelId] = useState<number | ''>('');
  const [neverExpires, setNeverExpires] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [webhookScope, setWebhookScope] = useState(false);
  const [created, setCreated] = useState<ApiClientCreateResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<number | null>(null);

  const catalogueQuery = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/channels');
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  const clientsQuery = useQuery({
    queryKey: ['api-clients'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/api-clients', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
    enabled: isAdmin,
  });

  function resetCreateForm() {
    setChannelId('');
    setNeverExpires(true);
    setExpiresAt('');
    setWebhookScope(false);
  }

  async function createClient() {
    if (!channelId) return;
    try {
      // Overrides #2: the real response has `secret`/`_secret_warning` fields
      // the generated schema doesn't document — this is the only time the
      // plaintext webhook secret is ever returned, so show it prominently.
      const { data, error } = await apiClient.POST('/api/v1/api-clients', {
        body: {
          channel: channelId,
          expires_at: neverExpires || !expiresAt ? null : new Date(expiresAt).toISOString(),
          scopes: webhookScope ? ['payments.webhook.post'] : [],
        },
      });
      if (error) throw new Error(errorMessage(error));
      setCreated(data as unknown as ApiClientCreateResponse);
      setCreateOpen(false);
      resetCreateForm();
      await queryClient.invalidateQueries({ queryKey: ['api-clients'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create API client', true);
    }
  }

  async function revoke(id: number, channel: number) {
    try {
      // The revoke action ignores its request body server-side (it only
      // flips is_active) but the generated schema still documents it as
      // requiring a full APIClientRequest — send the client's own current
      // channel to satisfy the type without changing anything real.
      const { error } = await apiClient.POST('/api/v1/api-clients/{id}/revoke', { params: { path: { id: String(id) } }, body: { channel } });
      if (error) throw new Error(errorMessage(error));
      toast('API key revoked');
      setRevokeTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['api-clients'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not revoke key', true);
    }
  }

  const revokeClient = clientsQuery.data?.find((c) => c.id === revokeTarget);

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Channel Catalogue</h3>
        {catalogueQuery.isLoading ? (
          <div className="empty">Loading…</div>
        ) : (
          catalogueQuery.data?.map((c) => (
            <KV key={c.code} label={c.label}>
              <span className="num">{c.code}</span>
            </KV>
          ))
        )}
      </div>

      {isAdmin && (
        <div className="card">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <h3 style={{ marginBottom: 0, flex: 1 }}>API Credentials</h3>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              New API Client
            </Button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>API Key</th>
                  <th>Scopes</th>
                  <th>Expires</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clientsQuery.data?.map((c) => {
                  const expired = isExpired(c.expires_at);
                  return (
                    <tr key={c.id}>
                      <td className="num">{c.api_key}</td>
                      <td>{c.scopes.length > 0 ? c.scopes.map((s) => SCOPE_LABEL[s] ?? s).join(', ') : 'Full access'}</td>
                      <td>{c.expires_at == null ? 'Never' : dateTime(c.expires_at)}</td>
                      <td>{c.last_used_at == null ? 'Never used' : dateTime(c.last_used_at)}</td>
                      <td>
                        <Tag variant={!c.is_active ? 'neutral' : expired ? 'bad' : 'ok'}>{!c.is_active ? 'Revoked' : expired ? 'Expired' : 'Active'}</Tag>
                      </td>
                      <td>
                        {c.is_active && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setRevokeTarget(c.id)}>
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {clientsQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No API clients registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <Modal
          open
          onClose={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
          title="New API Client"
          footer={
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={createClient}>
                Create
              </button>
            </>
          }
        >
          <Field label="Channel">
            <Select value={channelId} onChange={(e) => setChannelId(Number(e.target.value))}>
              <option value="">—</option>
              {catalogueQuery.data?.map((c) => (
                <option key={c.code} value={c.id ?? undefined}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, marginTop: 10 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={webhookScope} onChange={(e) => setWebhookScope(e.target.checked)} />
            Allow posting payment webhooks
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, marginTop: 10 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={neverExpires} onChange={(e) => setNeverExpires(e.target.checked)} />
            Never expires
          </label>
          {!neverExpires && (
            <Field label="Expires on">
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </Field>
          )}
        </Modal>
      )}

      {created != null && (
        <Modal
          open
          onClose={() => setCreated(null)}
          title="API Client Created"
          footer={<button className="btn btn-primary" onClick={() => setCreated(null)}>I&rsquo;ve saved this</button>}
        >
          <Notice variant="bad">{created._secret_warning}</Notice>
          <KV label="API key">
            <span className="num">{created.api_key}</span>
          </KV>
          <KV label="Secret">
            <span className="num">{created.secret}</span>
          </KV>
        </Modal>
      )}

      {revokeClient != null && (
        <Modal
          open
          onClose={() => setRevokeTarget(null)}
          title="Revoke API Key"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRevokeTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={() => revoke(revokeClient.id, revokeClient.channel)}>
                Revoke
              </button>
            </>
          }
        >
          <p>
            Revoke <span className="num">{revokeClient.api_key}</span>? This takes effect immediately — any integration still using this key will stop working.
          </p>
        </Modal>
      )}
    </>
  );
}
