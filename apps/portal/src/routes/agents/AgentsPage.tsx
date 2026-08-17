import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Field, Input, Modal, NumCell, TableWrap, Tag, useToast } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useWards } from '../../lib/wards';

const STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', SUSPENDED: 'bad', EXITED: 'neutral' };

export function AgentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: wards } = useWards();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState<number | ''>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/agents', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  async function onboard() {
    if (!fullName.trim() || !username.trim()) {
      toast("Enter the agent's name and a username", true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/agents', {
        body: { full_name: fullName.trim(), username: username.trim(), phone: phone.trim() || undefined, assigned_ward: ward || undefined },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Agent onboarded');
      setOnboardOpen(false);
      setFullName('');
      setUsername('');
      setPhone('');
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not onboard agent', true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="grow" />
        <Button variant="primary" onClick={() => setOnboardOpen(true)}>
          Onboard Agent
        </Button>
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load agents'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Agent Code</th>
                  <th>Device IMEI</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((a) => (
                    <tr key={a.id}>
                      <NumCell>{a.agent_code}</NumCell>
                      <NumCell>{a.device_imei || '—'}</NumCell>
                      <td>
                        <Tag variant={STATUS_TAG[a.status] ?? 'neutral'}>{a.status}</Tag>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="empty">
                      No field agents onboarded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {onboardOpen && (
        <Modal
          open
          onClose={() => setOnboardOpen(false)}
          title="Onboard Agent"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOnboardOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onboard}>
                Onboard
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
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Assigned ward">
            <select value={ward} onChange={(e) => setWard(Number(e.target.value) || '')}>
              <option value="">—</option>
              {wards?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.ward_name}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}
