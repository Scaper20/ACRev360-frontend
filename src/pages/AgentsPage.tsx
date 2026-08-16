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

type FieldAgent = components["schemas"]["FieldAgent"];

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function emptyForm() {
  return { full_name: "", username: "", password: "", phone: "", assigned_ward: "" };
}

export function AgentsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FieldAgent | null>(null);

  const { data: wards } = useQuery({
    queryKey: ["wards"],
    queryFn: async () => (await api.GET("/api/v1/wards")).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/agents");
      if (error) throw error;
      return data;
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["agent-activity", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/agents/{id}/activity", {
        params: { path: { id: String(selected!.id) } },
      });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/v1/agents", {
        body: {
          full_name: form.full_name,
          username: form.username,
          password: form.password || undefined,
          phone: form.phone || undefined,
          assigned_ward: form.assigned_ward ? Number(form.assigned_ward) : undefined,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setCreating(false);
      setForm(emptyForm());
    },
    onError: () => setError("Couldn't onboard this agent — check the username isn't already taken."),
  });

  const rows = data?.results ?? [];
  const wardOptions = wards?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="Field Agents" actions={<Button onClick={() => setCreating(true)}>Onboard Agent</Button>} />

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            emptyMessage="No field agents onboarded yet."
            columns={[
              { header: "Agent Code", render: (r) => <span className="num">{r.agent_code}</span> },
              { header: "Device IMEI", render: (r) => r.device_imei || "—" },
              { header: "Status", render: (r) => <StatusTag status={r.status} /> },
            ]}
          />
        )}
      </div>

      {creating && (
        <Modal
          title="Onboard Agent"
          onClose={() => setCreating(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button disabled={create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? "Onboarding…" : "Onboard"}
              </Button>
            </>
          }
        >
          {error && <div className="error-banner">{error}</div>}
          <div className="form-grid">
            <label className="field"><span>Full name</span><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
            <label className="field"><span>Username</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            <label className="field"><span>Password (optional)</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label className="field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="field">
              <span>Assigned ward</span>
              <select value={form.assigned_ward} onChange={(e) => setForm({ ...form, assigned_ward: e.target.value })}>
                <option value="">—</option>
                {wardOptions.map((w) => (<option key={w.id} value={w.id}>{w.ward_name}</option>))}
              </select>
            </label>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.agent_code} onClose={() => setSelected(null)} wide>
          <div className="detail-grid">
            <div className="detail-item"><span className="label">Status</span><span className="value"><StatusTag status={selected.status} /></span></div>
            <div className="detail-item"><span className="label">Device</span><span className="value">{selected.device_imei || "—"}</span></div>
            <div className="detail-item"><span className="label">Today's collections</span><span className="value num">{activity ? naira(activity.today_total) : "—"}</span></div>
          </div>
          <h2>Recent payments</h2>
          <DataTable
            rows={activity?.recent_payments ?? []}
            rowKey={(p) => p.id}
            emptyMessage="No payments posted by this agent yet."
            columns={[
              { header: "Payment Ref", render: (p) => <span className="num">{p.payment_ref}</span> },
              { header: "Bill Ref", render: (p) => <span className="num">{p.bill_ref}</span> },
              { header: "Amount", render: (p) => <span className="num">{naira(p.amount)}</span> },
              { header: "When", render: (p) => new Date(p.created_at).toLocaleString() },
            ]}
          />
        </Modal>
      )}
    </AppShell>
  );
}
