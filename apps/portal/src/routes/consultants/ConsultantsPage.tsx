import { apiClient, errorMessage } from '@acrev360/api';
import type { components } from '@acrev360/api';
import { Button, ClickableRow, Field, Input, KV, Modal, NumCell, Select, TableWrap, Tag, useToast } from '@acrev360/ui';
import type { TagVariant } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const STATUS_TAG: Record<string, TagVariant> = { ACTIVE: 'ok', SUSPENDED: 'bad', EXITED: 'neutral', PENDING: 'warn' };
const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXITED'];

export function ConsultantsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [contractRef, setContractRef] = useState('');
  const [rate, setRate] = useState('30');

  const { data, isLoading, error } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/consultants', { params: { query: {} } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  async function onboard() {
    if (!name.trim() || !contractRef.trim()) {
      toast('Enter a name and contract reference', true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/consultants', { body: { consultant_name: name.trim(), contract_ref: contractRef.trim(), commission_rate: rate } });
      if (error) throw new Error(errorMessage(error));
      toast('Consultant onboarded');
      setOnboardOpen(false);
      setName('');
      setContractRef('');
      await queryClient.invalidateQueries({ queryKey: ['consultants'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not onboard consultant', true);
    }
  }

  async function changeStatus(id: number, status: string) {
    try {
      const { error } = await apiClient.POST('/api/v1/consultants/{id}/status_change', {
        params: { path: { id: String(id) } },
        body: { status: status as components['schemas']['StatusC83Enum'] },
      });
      if (error) throw new Error(errorMessage(error));
      toast(`Status set to ${status}`);
      await queryClient.invalidateQueries({ queryKey: ['consultants'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change status', true);
    }
  }

  const consultant = data?.find((c) => c.id === detailId);

  return (
    <>
      {isAdmin && (
        <div className="toolbar">
          <div className="grow" />
          <Button variant="primary" onClick={() => setOnboardOpen(true)}>
            Onboard Consultant
          </Button>
        </div>
      )}
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load consultants'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contract Ref</th>
                  <th className="r">Commission</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((c) => (
                  <ClickableRow key={c.id} onClick={() => setDetailId(c.id)}>
                    <td>{c.consultant_name}</td>
                    <NumCell>{c.contract_ref}</NumCell>
                    <NumCell className="r">{c.commission_rate}%</NumCell>
                    <td>
                      <Tag variant={STATUS_TAG[c.status] ?? 'neutral'}>{c.status}</Tag>
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {onboardOpen && (
        <Modal
          open
          onClose={() => setOnboardOpen(false)}
          title="Onboard Consultant"
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
          <Field label="Consultant name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Contract reference">
            <Input value={contractRef} onChange={(e) => setContractRef(e.target.value)} placeholder="KAC/RC/2026/xxx" />
          </Field>
          <Field label="Commission rate (%)">
            <Input type="number" min={0} max={100} step={0.01} value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        </Modal>
      )}

      {consultant != null && (
        <Modal
          open
          onClose={() => setDetailId(null)}
          title={consultant.consultant_name}
          footer={<button className="btn btn-ghost" onClick={() => setDetailId(null)}>Close</button>}
        >
          <KV label="Contract ref">
            <span className="num">{consultant.contract_ref}</span>
          </KV>
          <KV label="Commission rate">{consultant.commission_rate}%</KV>
          <KV label="Status">
            <Tag variant={STATUS_TAG[consultant.status] ?? 'neutral'}>{consultant.status}</Tag>
          </KV>
          {isAdmin && (
            <Field label="Change status">
              <Select value={consultant.status} onChange={(e) => changeStatus(consultant.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </Modal>
      )}
    </>
  );
}
