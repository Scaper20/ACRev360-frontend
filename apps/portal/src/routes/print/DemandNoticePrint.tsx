import { apiClient, errorMessage } from '@acrev360/api';
import { money2 } from '@acrev360/ui';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { amountInWords } from '../../lib/numberToWords';
import './DemandNoticePrint.css';

export function DemandNoticePrint() {
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
  if (!bill) return <div className="print-err">Loading demand notice…</div>;

  // issued_at isn't exposed by the public lookup — due_date's year is a
  // reliable proxy (bills are due 30 days after issue), and "date of demand
  // notice" is shown as today, the date this print is actually generated.
  const year = new Date(bill.due_date).getFullYear();
  const billRefDigits = (billRef.match(/\d+$/)?.[0] ?? '0').slice(-4);
  const noticeNo = 2000 + (Number(billRefDigits) % 8000);
  const today = new Date();
  const arrears = Number(bill.arrears_amount);
  const grandTotal = Number(bill.balance);

  return (
    <div className="print-page">
      <div className="print-sheet">
        <div className="print-head">
          <div className="print-crest">KAC</div>
          <div className="titles">
            <h1>KUJE AREA COUNCIL</h1>
            <div className="fcta">FEDERAL CAPITAL TERRITORY ADMINISTRATION</div>
            <div className="addr">Secretariat Complex, Kuje-Abuja &middot; Tel: 08035730391, 08050791026</div>
            <div className="dept">
              FINANCE DEPARTMENT
              <small>(Revenue Division)</small>
            </div>
          </div>
          <div className="print-noref">No: {noticeNo}</div>
        </div>
        <div className="print-banner">HARMONISED DEMAND NOTICE</div>
        <div className="print-fields">
          <div>
            <b>Our Ref:</b> <span className="fill">KAC/FS/RD/1/VOL.{billRefDigits}</span>
          </div>
          <div>
            <b>Demand Notice:</b> <span className="fill">{bill.bill_ref}</span>
          </div>
          <div>
            <b>Type of Business:</b> <span className="fill">{bill.full_name} ({bill.payer_ref})</span>
          </div>
          <div>
            <b>Location / Address:</b>{' '}
            <span className="fill">
              {bill.address || '—'}
              {bill.ward_name ? `, ${bill.ward_name}` : ''}
            </span>
          </div>
          <div>
            <b>Date of Demand Notice:</b> <span className="fill">{today.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="print-notice-text">
          The Management of Kuje Area Council wishes to notify you of your bill of the year: <b>{year}</b>. This is pursuant to the provision of the Kuje Area
          Council bye-law and the provision of section 7, fourth schedule of the 1999 Constitution of the Federal Republic of Nigeria as amended, and other
          relevant laws on the list of Taxes and Levies collected by the Local Government with regards to the operation of business within the Area Council.
        </div>
        <table>
          <thead>
            <tr>
              <th>S/No</th>
              <th>Items</th>
              <th className="num">Payment Code</th>
              <th className="num">Arrears if any</th>
              <th className="num">Current Bill</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((l, i) => (
              <tr key={l.id}>
                <td className="sn">{i + 1}</td>
                <td>{l.item_name}</td>
                <td className="num">{l.harmonised_code}</td>
                <td className="num">{money2(0)}</td>
                <td className="num">{money2(l.line_amount)}</td>
                <td className="num">{money2(l.line_amount)}</td>
              </tr>
            ))}
            {arrears > 0 && (
              <tr>
                <td className="sn">{bill.lines.length + 1}</td>
                <td>Arrears — Brought Forward (Prior Bills Consolidated)</td>
                <td className="num">—</td>
                <td className="num">{money2(arrears)}</td>
                <td className="num">{money2(0)}</td>
                <td className="num">{money2(arrears)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Grand Total</td>
              <td className="num">{money2(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="print-words">
          Amount in words: <span className="fill">{amountInWords(grandTotal)}</span>
        </div>
        <div className="print-payline">Payable to Kuje Area Council Account within 14 days of this notice.</div>
        <div className="print-acct">
          <div>
            <div className="kv">
              <b>Account Details</b>
            </div>
            <div className="kv">Account Name: Kuje Area Council Revenue Account</div>
            <div className="kv">Account No: 2031862507</div>
            <div className="kv">First Bank, Kuje Branch</div>
          </div>
        </div>
        <div className="print-sig">
          <div className="line">Chief Revenue Officer</div>
        </div>
      </div>
    </div>
  );
}
