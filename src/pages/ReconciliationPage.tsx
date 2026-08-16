import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StatusTag } from "../components/StatusTag";
import type { components } from "../api/schema";

const CHANNELS: components["schemas"]["ChannelCodeEnum"][] = ["POS", "OTC", "IB_MB", "USSD", "FIRSTMONIE"];

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function ReconciliationPage() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState<components["schemas"]["ChannelCodeEnum"]>("OTC");
  const [selected, setSelected] = useState<components["schemas"]["ReconciliationRun"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["reconciliation"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reconciliation");
      if (error) throw error;
      return data;
    },
  });

  const runReconciliation = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/reconciliation/run", { body: { date, channel_code: channel } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
      setRunning(false);
    },
    onError: () => setError("Couldn't run reconciliation for that date/channel."),
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="Reconciliation" actions={<Button onClick={() => setRunning(true)}>Run Reconciliation</Button>} />

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            emptyMessage="No reconciliation runs yet."
            columns={[
              { header: "Channel", render: (r) => r.channel_code },
              { header: "Date", render: (r) => r.run_date },
              { header: "Platform total", render: (r) => <span className="num">{naira(r.total_platform)}</span> },
              { header: "Bank total", render: (r) => <span className="num">{naira(r.total_bank)}</span> },
              { header: "Exceptions", render: (r) => r.exceptions.length },
              { header: "Status", render: (r) => <StatusTag status={r.status} /> },
            ]}
          />
        )}
      </div>

      {running && (
        <Modal
          title="Run Reconciliation"
          onClose={() => setRunning(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setRunning(false)}>Cancel</Button>
              <Button disabled={runReconciliation.isPending} onClick={() => runReconciliation.mutate()}>
                {runReconciliation.isPending ? "Running…" : "Run"}
              </Button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <label className="field">
            <span>Channel</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </Modal>
      )}

      {selected && (
        <Modal title={`${selected.channel_code} — ${selected.run_date}`} onClose={() => setSelected(null)} wide>
          <div className="detail-grid">
            <div className="detail-item"><span className="label">Status</span><span className="value"><StatusTag status={selected.status} /></span></div>
            <div className="detail-item"><span className="label">Platform total</span><span className="value num">{naira(selected.total_platform)}</span></div>
            <div className="detail-item"><span className="label">Bank total</span><span className="value num">{naira(selected.total_bank)}</span></div>
          </div>
          <h2>Exceptions</h2>
          <DataTable
            rows={selected.exceptions}
            rowKey={(e) => e.id}
            emptyMessage="No exceptions — platform and bank feed matched exactly."
            columns={[
              { header: "Bank ref", render: (e) => <span className="num">{e.bank_txn_ref}</span> },
              { header: "Amount", render: (e) => <span className="num">{naira(e.amount)}</span> },
              { header: "Note", render: (e) => e.note || "—" },
              { header: "Resolved", render: (e) => (e.resolved_at ? new Date(e.resolved_at).toLocaleString() : "Open") },
            ]}
          />
        </Modal>
      )}
    </AppShell>
  );
}
