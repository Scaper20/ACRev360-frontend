import { Button, dateTime, money2 } from '@acrev360/ui';
import { QrBlock } from '../lib/qr';

export interface ReceiptResult {
  queued: boolean;
  amount: string;
  payerName: string;
  channel: string;
  receiptRef?: string;
  qrToken?: string;
  time: string;
}

export function ReceiptView({ receipt, onDone }: { receipt: ReceiptResult; onDone: () => void }) {
  return (
    <div className="field-card field-receipt">
      <div style={{ fontSize: 10.5, letterSpacing: '.09em', color: 'var(--ink-40)', textTransform: 'uppercase' }}>Receipt</div>
      <div className="amt num">{money2(receipt.amount)}</div>
      <div className={`status-pill${receipt.queued ? ' queued' : ''}`}>{receipt.queued ? 'Queued — syncs when online' : 'Payment confirmed'}</div>

      {!receipt.queued && receipt.qrToken && <QrBlock token={receipt.qrToken} />}

      <div style={{ marginTop: 14, textAlign: 'left' }}>
        {receipt.receiptRef && (
          <div className="field-kv">
            <span>Receipt</span>
            <b className="num">{receipt.receiptRef}</b>
          </div>
        )}
        <div className="field-kv">
          <span>Payer</span>
          <b>{receipt.payerName}</b>
        </div>
        <div className="field-kv">
          <span>Channel</span>
          <b>{receipt.channel}</b>
        </div>
        <div className="field-kv">
          <span>Time</span>
          <b className="num">{dateTime(receipt.time)}</b>
        </div>
      </div>

      <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-60)' }}>
        {receipt.queued
          ? 'The payer keeps this reference. The official receipt is issued once this device reconnects and syncs.'
          : 'Scanning the code, or checking the receipt reference on the portal, confirms this receipt is genuine.'}
      </p>

      <Button variant="primary" style={{ width: '100%', marginTop: 16 }} onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
