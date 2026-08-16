import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { Typeahead } from "../components/Typeahead";
import type { components } from "../api/schema";

type Bill = components["schemas"]["Bill"];

const CHANNELS: components["schemas"]["ChannelCodeEnum"][] = ["POS", "OTC", "IB_MB", "USSD", "FIRSTMONIE"];

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [posting, setPosting] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<components["schemas"]["ChannelCodeEnum"]>("OTC");
  const [bankTxnRef, setBankTxnRef] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/payments");
      if (error) throw error;
      return data;
    },
  });

  function resetForm() {
    setBill(null);
    setAmount("");
    setBankTxnRef("");
    setFormError(null);
  }

  const postPayment = useMutation({
    mutationFn: async () => {
      if (!bill) throw new Error("Select a bill first.");
      const { data, error } = await api.POST("/api/v1/payments", {
        body: { bill_id: bill.id, amount, channel_code: channel, bank_txn_ref: bankTxnRef },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setPosting(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const message = (err as { error?: string })?.error ?? (err as Error)?.message ?? "Couldn't post the payment.";
      setFormError(message);
    },
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="Payments" actions={<Button onClick={() => setPosting(true)}>Collect Payment</Button>} />

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="No payments recorded yet."
            columns={[
              { header: "Payment Ref", render: (r) => <span className="num">{r.payment_ref}</span> },
              { header: "Bill Ref", render: (r) => <span className="num">{r.bill_ref}</span> },
              { header: "Channel", render: (r) => r.channel_code },
              { header: "Amount", render: (r) => <span className="num">{naira(r.amount)}</span> },
              { header: "Status", render: (r) => r.txn_status },
              { header: "When", render: (r) => new Date(r.created_at).toLocaleString() },
            ]}
          />
        )}
      </div>

      {posting && (
        <Modal
          title="Collect Payment"
          onClose={() => { setPosting(false); resetForm(); }}
          actions={
            <>
              <Button variant="ghost" onClick={() => { setPosting(false); resetForm(); }}>Cancel</Button>
              <Button disabled={postPayment.isPending || !bill || !amount} onClick={() => postPayment.mutate()}>
                {postPayment.isPending ? "Posting…" : "Post Payment"}
              </Button>
            </>
          }
        >
          {formError && <div className="error-banner">{formError}</div>}
          <label className="field">
            <span>Bill</span>
            {bill ? (
              <span className="selected-chip">
                {bill.bill_ref} — balance {naira(bill.balance)}
                <button className="icon-btn" type="button" onClick={() => setBill(null)}>×</button>
              </span>
            ) : (
              <Typeahead<Bill>
                placeholder="Search by bill reference or payer name…"
                search={async (q) => {
                  const { data } = await api.GET("/api/v1/bills", { params: { query: { q } } });
                  return data?.results ?? [];
                }}
                renderOption={(b) => `${b.bill_ref} — ${b.full_name} (balance ${naira(b.balance)})`}
                onSelect={setBill}
              />
            )}
          </label>
          <label className="field">
            <span>Amount (₦)</span>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="field">
            <span>Channel</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Bank/teller reference (optional)</span>
            <input value={bankTxnRef} onChange={(e) => setBankTxnRef(e.target.value)} />
          </label>
        </Modal>
      )}
    </AppShell>
  );
}
