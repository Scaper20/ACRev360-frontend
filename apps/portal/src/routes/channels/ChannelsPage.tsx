import { apiClient, errorMessage } from '@acrev360/api';
import type { ApiClientCreateResponse } from '@acrev360/api';
import { Button, Field, KV, Modal, Notice, Select, Tag, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export function ChannelsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [channelId, setChannelId] = useState<number | ''>('');
  const [created, setCreated] = useState<ApiClientCreateResponse | null>(null);

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

  async function createClient() {
    if (!channelId) return;
    try {
      // Overrides #2: the real response has `secret`/`_secret_warning` fields
      // the generated schema doesn't document — this is the only time the
      // plaintext webhook secret is ever returned, so show it prominently.
      const { data, error } = await apiClient.POST('/api/v1/api-clients', { body: { channel: channelId } });
      if (error) throw new Error(errorMessage(error));
      setCreated(data as unknown as ApiClientCreateResponse);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['api-clients'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create API client', true);
    }
  }

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
          {clientsQuery.data?.map((c) => (
            <KV key={c.id} label={<span className="num">{c.api_key}</span>}>
              <Tag variant={c.is_active ? 'ok' : 'neutral'}>{c.is_active ? 'Active' : 'Inactive'}</Tag>
            </KV>
          ))}
          {clientsQuery.data?.length === 0 && <div className="empty">No API clients registered</div>}
        </div>
      )}

      {createOpen && (
        <Modal
          open
          onClose={() => setCreateOpen(false)}
          title="New API Client"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>
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
    </>
  );
}
