import { apiClient, errorMessage } from '@acrev360/api';
import { money2 } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import './DemandBillPrint.css';

/** Old prototype used the bill's internal numeric id for these synthetic
 * line references; the new backend's public bill lookup only exposes
 * bill_ref (a string, e.g. "KAC/2026/000123") — derive an equivalent
 * numeric seed from its trailing digits instead. Still stable and
 * reproducible per bill, just sourced differently. */
function lineRef(billRefDigits: string, idx: number, code: string) {
  const digits = String(code || '')
    .replace(/\D/g, '')
    .padEnd(6, '0')
    .slice(-6);
  return `SB-${billRefDigits.padStart(4, '0')}${String(idx).padStart(2, '0')}${digits}260${billRefDigits.padStart(4, '0')}`;
}

export function DemandBillPrint() {
  const [params] = useSearchParams();
  const billRef = params.get('bill');

  const { data: bill, error } = useQuery({
    queryKey: ['print', 'bill', billRef],
    enabled: billRef != null,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bills/{bill_ref}', { params: { path: { bill_ref: billRef! } } });
      if (error) throw new Error(errorMessage(error));
      return data;
    },
  });

  if (!billRef) return <div className="print-err">No bill reference given.</div>;
  if (error) return <div className="print-err">{error instanceof Error ? error.message : 'Bill not found'}</div>;
  if (!bill) return <div className="print-err">Loading demand bill…</div>;

  // issued_at isn't exposed by the public lookup (only due_date, balance,
  // etc.) — due_date's year is a reliable proxy since bills are due 30 days
  // after issue, almost never crossing a calendar year.
  const year = new Date(bill.due_date).getFullYear();
  const billRefDigits = (billRef.match(/\d+$/)?.[0] ?? '0').slice(-4);
  const arrears = Number(bill.arrears_amount);
  const totalDue = Number(bill.balance);

  return (
    <div className="print-page">
      <div className="print-sheet">
        <div className="print-head">
          <div className="print-crest">KAC</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1>KUJE AREA COUNCIL</h1>
            <div className="sub">Kuje Area Council Abuja, FCT &middot; Phone: 08035730391 &middot; Email: kujefct@gmail.com</div>
          </div>
          <div className="print-qr" title="Verification code" />
        </div>
        <hr />
        <div className="print-grid2">
          <div>
            <div>
              <b>Notice is hereby given to:</b>
            </div>
            <div>
              {bill.full_name} ({bill.payer_ref})
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Property Address:</b>
            </div>
            <div>
              {bill.address || '—'}
              {bill.ward_name ? `, ${bill.ward_name}` : ''}
            </div>
          </div>
          <div>
            <div>
              <b>Account name:</b> Kuje Area Council
            </div>
            <div>
              <b>Revenue Account:</b> 2031862507
            </div>
            <div>
              <b>Bank:</b> First Bank, Kuje Branch
            </div>
          </div>
          <div>
            <div>
              <b>IMPORTANT!</b>
            </div>
            <div>All enquiries are to be forwarded to:</div>
            <div>Council Treasurer &ndash; 07064683372, 08050791026</div>
          </div>
        </div>
        <div className="print-notice-text">
          The <b>KUJE AREA COUNCIL</b> under the Local Government law demands payment of <b>DEMAND NOTICE FOR YEAR {year}</b> on the above property/business in
          respect of the financial year under consideration. The amount due for the current year and arrears (if any) of the former rate is now due from you.
          Payment of the total amount is to be made at any of the designated banks not later than <b>7 days</b> from the date of this demand notice. If payment
          is not made within <b>one week</b> of the date of this Demand Notice, legal proceedings shall be taken immediately.
        </div>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Bill Reference</th>
              <th>Summary</th>
              <th className="num">Arrears (₦)</th>
              <th className="num">Debit (₦)</th>
              <th className="num">Credit (₦)</th>
              <th className="num">Balance (₦)</th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((l, i) => {
              const bandNote = l.band_label != null ? ` (${l.band_label}${l.tier_label != null ? ` — ${l.tier_label}` : ''})` : '';
              return (
                <tr key={l.id}>
                  <td>{year}</td>
                  <td className="num">{lineRef(billRefDigits, i + 1, l.harmonised_code)}</td>
                  <td>
                    {l.item_name}
                    {bandNote}
                  </td>
                  <td className="num">{money2(0)}</td>
                  <td className="num">{money2(l.line_amount)}</td>
                  <td className="num">{money2(0)}</td>
                  <td className="num">{money2(l.line_amount)}</td>
                </tr>
              );
            })}
            {arrears > 0 &&
              bill.superseded_bills.map((s) => (
                <tr key={s.bill_ref}>
                  <td>{year}</td>
                  <td className="num">{s.bill_ref}</td>
                  <td>Arrears — Brought Forward</td>
                  <td className="num">{money2(s.amount)}</td>
                  <td className="num">{money2(0)}</td>
                  <td className="num">{money2(0)}</td>
                  <td className="num">{money2(s.amount)}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Hours of Payment: Monday &ndash; Friday, 8:00 a.m. &ndash; 4:00 p.m.</td>
              <td>
                Harmonized Bill Reference
                <br />
                <span style={{ fontWeight: 400 }}>{bill.bill_ref}</span>
              </td>
              <td colSpan={3}>Total Due</td>
              <td className="num">{money2(totalDue)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="print-warn">
          PLEASE PAY DIRECTLY TO THE OVERHEAD DESIGNATED BANK AND COLLECT AN AUTOMATED REVENUE RECEIPT AT THE POINT OF PAYMENT &mdash; WITHOUT THIS YOUR PAYMENT
          IS NULL AND VOID.
        </div>
        <div className="print-warn">COUNCIL&rsquo;S POS IS AVAILABLE &mdash; PLEASE DO NOT PAY THROUGH ANY COMMERCIAL POS/ASSOCIATION.</div>

        <div className="print-copies">
          {['Bank’s / Agent’s Copy', "Local Govt's Copy"].map((label) => (
            <div className="print-copy" key={label}>
              <h3>{label}</h3>
              <div>KUJE AREA COUNCIL</div>
              <div>DEMAND NOTICE FOR YEAR {year}</div>
              <div className="kv">
                <b>Payer Name:</b> {bill.full_name}
              </div>
              <div className="kv">
                <b>Payer ID:</b> {bill.payer_ref}
              </div>
              <div className="kv">
                <b>Address:</b> {bill.address || '—'}
              </div>
              <div className="kv">
                <b>Area Council:</b> Kuje Area Council
              </div>
              <div className="kv">
                <b>Total Due:</b> {money2(totalDue)}
              </div>
              <div className="print-sig">Chief Revenue Officer</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 6 }}>
          All enquiries are to be forwarded to the Chairman &ndash; Revenue Collection and Review Committee
        </div>
        <div className="print-lost">LOST BILL WILL ATTRACT A FINE OF ₦1,000, FOR REPRINTING</div>
      </div>
    </div>
  );
}
