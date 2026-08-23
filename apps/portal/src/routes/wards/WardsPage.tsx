import { apiClient, errorMessage } from '@acrev360/api';
import { Button, Field, Input, Modal, NumCell, Select, Tag, TableWrap, useToast } from '@acrev360/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const ZONE_TYPES = [
  { value: 'WARD', label: 'Ward' },
  { value: 'ZONE', label: 'Zone' },
  { value: 'DISTRICT', label: 'District' },
] as const;

export function WardsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [wardCode, setWardCode] = useState('');
  const [wardName, setWardName] = useState('');
  const [zoneType, setZoneType] = useState<(typeof ZONE_TYPES)[number]['value']>('WARD');

  const { data, isLoading, error } = useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/wards', { params: { query: { page: undefined } } });
      if (error) throw new Error(errorMessage(error));
      return data.results;
    },
  });

  async function addWard() {
    if (!wardCode.trim() || !wardName.trim()) {
      toast('Enter a ward code and name', true);
      return;
    }
    try {
      const { error } = await apiClient.POST('/api/v1/wards', {
        body: { ward_code: wardCode.trim(), ward_name: wardName.trim(), zone_type: zoneType },
      });
      if (error) throw new Error(errorMessage(error));
      toast('Ward added');
      setAddOpen(false);
      setWardCode('');
      setWardName('');
      setZoneType('WARD');
      await queryClient.invalidateQueries({ queryKey: ['wards'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add ward', true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="grow" />
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          Add Ward
        </Button>
      </div>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load wards'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((w) => (
                    <tr key={w.id}>
                      <NumCell>{w.ward_code}</NumCell>
                      <td>{w.ward_name}</td>
                      <td>
                        <Tag variant="neutral">{ZONE_TYPES.find((z) => z.value === w.zone_type)?.label ?? w.zone_type}</Tag>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="empty">
                      No wards added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {addOpen && (
        <Modal
          open
          onClose={() => setAddOpen(false)}
          title="Add Ward"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addWard}>
                Add
              </button>
            </>
          }
        >
          <Field label="Ward code">
            <Input value={wardCode} onChange={(e) => setWardCode(e.target.value)} placeholder="e.g. KJ-01" />
          </Field>
          <Field label="Ward name">
            <Input value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="e.g. Chibiri" />
          </Field>
          <Field label="Type">
            <Select value={zoneType} onChange={(e) => setZoneType(e.target.value as (typeof ZONE_TYPES)[number]['value'])}>
              {ZONE_TYPES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </Select>
          </Field>
        </Modal>
      )}
    </>
  );
}
