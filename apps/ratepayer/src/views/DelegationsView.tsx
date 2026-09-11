import { apiClient, errorMessage } from '@acrev360/api';
import type { MyDelegationList } from '@acrev360/api';
import { Button, Card, Field, Input, TableWrap, Tag, dateTime, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function DelegationsView() {
  const [proxyEmail, setProxyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my', 'delegations'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/my/delegations');
      if (error) throw new Error(errorMessage(error));
      // Documented as a paginated envelope, confirmed live: bare array —
      // see packages/api/src/overrides.ts #12.
      return data as unknown as MyDelegationList;
    },
  });

  async function grant() {
    if (!proxyEmail.trim()) {
      toast('Enter the email of the account to delegate to', true);
      return;
    }
    setSubmitting(true);
    try {
      // Documented as returning the paginated list, confirmed live: 201s
      // with the single created delegation instead — see overrides.ts #12.
      // The generated response type is wrong either way, so there's nothing
      // useful to read off `data` here beyond confirming no error occurred.
      const { error } = await apiClient.POST('/api/v1/my/delegations', { body: { proxy_email: proxyEmail.trim() } });
      if (error) throw new Error(errorMessage(error));
      toast(`Access granted to ${proxyEmail.trim()}`);
      setProxyEmail('');
      await queryClient.invalidateQueries({ queryKey: ['my', 'delegations'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not grant access', true);
    } finally {
      setSubmitting(false);
    }
  }

  async function revoke(id: number) {
    if (!window.confirm('Revoke this account’s access to your bills, payments and receipts?')) return;
    try {
      const { error } = await apiClient.POST('/api/v1/my/{id}/revoke', { params: { path: { id: String(id) } } });
      if (error) throw new Error(errorMessage(error));
      toast('Access revoked');
      await queryClient.invalidateQueries({ queryKey: ['my', 'delegations'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not revoke access', true);
    }
  }

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <h3>Give someone access to your account</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-40)', marginTop: -4, marginBottom: 14 }}>
          They&rsquo;ll be able to see your bills, payments and receipts — not make payments or change your details. They need their own ACRev360 account first.
        </p>
        <div className="row" style={{ alignItems: 'end' }}>
          <Field label="Their email address">
            <Input type="email" value={proxyEmail} onChange={(e) => setProxyEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Button variant="primary" onClick={grant} disabled={submitting}>
            {submitting ? 'Granting…' : 'Grant Access'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3>Who has access</h3>
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load delegations'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Granted</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((d) => (
                    <tr key={d.id}>
                      <td>{d.proxy_full_name}</td>
                      <td>{d.proxy_email}</td>
                      <td>{dateTime(d.granted_at)}</td>
                      <td>
                        <Tag variant={d.revoked_at == null ? 'ok' : 'neutral'}>{d.revoked_at == null ? 'Active' : 'Revoked'}</Tag>
                      </td>
                      <td>
                        {d.revoked_at == null && (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => revoke(d.id)}>
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      You haven&rsquo;t given anyone access yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </Card>
    </>
  );
}
