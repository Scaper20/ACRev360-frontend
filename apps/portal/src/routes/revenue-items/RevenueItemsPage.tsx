import { apiClient, errorMessage } from '@acrev360/api';
import { ClickableRow, Field, Input, Modal, NumCell, Tag, TableWrap, money, useToast } from '@acrev360/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useRevenueItems } from '../../lib/revenueItems';
import { RateBandsEditor } from './RateBandsEditor';

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
                  <th>Pricing</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((i) => {
                  const banded = i.rate_bands.length > 0;
                  const pricing = banded ? (
                    <Tag variant="brass">{i.rate_bands.length} band{i.rate_bands.length === 1 ? '' : 's'}</Tag>
                  ) : (
                    <Tag variant="neutral">Flat</Tag>
                  );
                  return isAdmin ? (
                    <ClickableRow key={i.id} onClick={() => { setRateItemId(i.id); setNewRate(i.current_rate); }}>
                      <NumCell>{i.harmonised_code}</NumCell>
                      <td>{i.item_name}</td>
                      <td>{i.category_name}</td>
                      <NumCell className="r">{banded ? '—' : money(i.current_rate)}</NumCell>
                      <td>{pricing}</td>
                    </ClickableRow>
                  ) : (
                    <tr key={i.id}>
                      <NumCell>{i.harmonised_code}</NumCell>
                      <td>{i.item_name}</td>
                      <td>{i.category_name}</td>
                      <NumCell className="r">{banded ? '—' : money(i.current_rate)}</NumCell>
                      <td>{pricing}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableWrap>
      </div>

      {item != null && (
        <Modal
          open
          onClose={() => setRateItemId(null)}
          title={item.item_name}
          footer={
            <button className="btn btn-ghost" onClick={() => setRateItemId(null)}>
              Close
            </button>
          }
        >
          <h3 style={{ margin: '0 0 6px' }}>Flat Rate</h3>
          <p style={{ fontSize: 12.5, color: 'var(--ink-60)', marginBottom: 12 }}>
            {item.rate_bands.length > 0
              ? 'This item is priced by the bands below — the flat rate has no effect while bands are active.'
              : `Current rate is ${money(item.current_rate)}. Changing it closes the current rate-history row and opens a new one — past assessments keep citing the rate they were priced at.`}
          </p>
          <div className="row" style={{ alignItems: 'end' }}>
            <Field label="New rate (₦)">
              <Input type="number" min={0} step={0.01} value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </Field>
            <button className="btn btn-primary" onClick={changeRate} style={{ maxWidth: 140 }}>
              Save Flat Rate
            </button>
          </div>

          <RateBandsEditor
            itemId={item.id}
            existingBands={item.rate_bands}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['revenue-items'] })}
          />
        </Modal>
      )}
    </>
  );
}
