import { apiClient, errorMessage } from '@acrev360/api';
import { ClickableRow, Field, Input, Modal, NumCell, TableWrap, money, useToast } from '@acrev360/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRevenueItems } from '../../lib/revenueItems';

export function RevenueItemsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === 'COUNCIL_ADMIN';
  const { data, isLoading, error } = useRevenueItems();
  const [rateItemId, setRateItemId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const item = data?.find((i) => i.id === rateItemId);

  async function changeRate() {
    if (!rateItemId || !newRate) return;
    try {
      const { error } = await apiClient.POST('/api/v1/revenue-items/{id}/rate', { params: { path: { id: String(rateItemId) } }, body: { rate_amount: newRate } });
      if (error) throw new Error(errorMessage(error));
      toast('Rate updated');
      setRateItemId(null);
      setNewRate('');
      await queryClient.invalidateQueries({ queryKey: ['revenue-items'] });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not change rate', true);
    }
  }

  return (
    <>
      <div className="card">
        <TableWrap>
          {isLoading ? (
            <div className="empty">Loading…</div>
          ) : error ? (
            <div className="notice notice-bad">{error instanceof Error ? error.message : 'Failed to load revenue items'}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="r">Current Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((i) =>
                  isAdmin ? (
                    <ClickableRow key={i.id} onClick={() => { setRateItemId(i.id); setNewRate(i.current_rate); }}>
                      <NumCell>{i.harmonised_code}</NumCell>
                      <td>{i.item_name}</td>
                      <td>{i.category_name}</td>
                      <NumCell className="r">{money(i.current_rate)}</NumCell>
                    </ClickableRow>
                  ) : (
                    <tr key={i.id}>
                      <NumCell>{i.harmonised_code}</NumCell>
                      <td>{i.item_name}</td>
                      <td>{i.category_name}</td>
                      <NumCell className="r">{money(i.current_rate)}</NumCell>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {item != null && (
        <Modal
          open
          onClose={() => setRateItemId(null)}
          title={`Change Rate — ${item.item_name}`}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRateItemId(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={changeRate}>
                Save
              </button>
            </>
          }
        >
          <p style={{ fontSize: 12.5, color: 'var(--ink-60)', marginBottom: 12 }}>
            Current rate is {money(item.current_rate)}. Changing it closes the current rate-history row and opens a new one — past assessments keep citing the rate they were priced at.
          </p>
          <Field label="New rate (₦)">
            <Input type="number" min={0} step={0.01} value={newRate} onChange={(e) => setNewRate(e.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
