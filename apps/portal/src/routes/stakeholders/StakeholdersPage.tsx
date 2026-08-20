import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Field, Input, Modal, Notice, NumCell, Pagination, TableWrap, Tag, dateTime, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export function StakeholdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['stakeholders', page],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/stakeholders', { params: { query: { page } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  async function onboard() {
    if (!fullName.trim() || !username.trim()) {
      toast("Enter the stakeholder's name and a username", true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/stakeholders', {
        body: { full_name: fullName.trim(), username: username.trim(), phone: phone.trim() || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Stakeholder account created');
      setOnboardOpen(false);
      setFullName('');
      setUsername('');
      setPhone('');
      await queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create stakeholder account', true);
    }
  }

  return (
    <>
      {isAdmin && (
        <div className="toolbar">
          <div className="grow" />
          <Button variant="primary" onClick={() => setOnboardOpen(true)}>
            New Stakeholder
          </Button>
        </div>
      )}
      <div className="card">
        <div style={{ marginBottom: 12 }}>
          <Notice variant="info">
            Read-only accounts for oversight — see the Dashboard and Global Performance figures only. No payer, bill,
            payment, or sub-consultant names are ever exposed to this role.
          </Notice>
        </div>
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load stakeholders'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {data && data.results.length > 0 ? (
                  data.results.map((s) => (
                    <tr key={s.id}>
                      <td>{s.full_name}</td>
                      <NumCell>{s.username}</NumCell>
                      <NumCell>{s.phone || '—'}</NumCell>
                      <td>
                        <Tag variant={s.is_active ? 'ok' : 'neutral'}>{s.is_active ? 'Active' : 'Inactive'}</Tag>
                      </td>
                      <NumCell>{dateTime(s.date_joined)}</NumCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      No stakeholder accounts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
        {data != null && <Pagination page={page} count={data.count} onPageChange={setPage} />}
      </div>

      {onboardOpen && (
        <Modal
          open
          onClose={() => setOnboardOpen(false)}
          title="New Stakeholder"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOnboardOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onboard}>
                Create
              </button>
            </>
          }
        >
          <Field label="Full name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="Phone (optional)">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
