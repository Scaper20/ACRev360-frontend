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

type Payer = components["schemas"]["Payer"];

const PAYER_TYPES: components["schemas"]["PayerTypeEnum"][] = ["INDIVIDUAL", "BUSINESS", "GOVERNMENT", "NGO"];
const BUSINESS_SIZES: components["schemas"]["BusinessSizeEnum"][] = ["MICRO", "SMALL", "MEDIUM", "LARGE"];

function emptyForm() {
  return {
    payer_type: "INDIVIDUAL" as components["schemas"]["PayerTypeEnum"],
    full_name: "",
    phone: "",
    address: "",
    ward: "",
    nin_bvn_hash: "",
    tin: "",
    business_size: "" as components["schemas"]["BusinessSizeEnum"] | "",
    revenue_item_ids: [] as number[],
  };
}

export function PayersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Payer | null>(null);

  const { data: wards } = useQuery({
    queryKey: ["wards"],
    queryFn: async () => (await api.GET("/api/v1/wards")).data,
  });
  const { data: revenueItems } = useQuery({
    queryKey: ["revenue-items"],
    queryFn: async () => (await api.GET("/api/v1/revenue-items")).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payers", q],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/payers", { params: { query: { q: q || undefined } } });
      if (error) throw error;
      return data;
    },
  });

  const { data: draftAssessments } = useQuery({
    queryKey: ["draft-assessments", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/payers/{id}/draft-assessments", {
        params: { path: { id: String(selected!.id) } },
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: payerBills } = useQuery({
    queryKey: ["payer-bills", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bills", {
        params: { query: { payer: selected!.id } as unknown as { page?: number } },
      });
      if (error) throw error;
      return data;
    },
  });

  const createPayer = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        ward: Number(form.ward),
        business_size: form.business_size || null,
        force: false,
      };
      const { data, error } = await api.POST("/api/v1/payers", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payers"] });
      setCreating(false);
      setForm(emptyForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      const message = (err as { error?: string })?.error ?? "Couldn't create the payer.";
      setFormError(message);
    },
  });

  const issueHarmonizedBill = useMutation({
    mutationFn: async (payerId: number) => {
      const { data, error } = await api.POST("/api/v1/bills", {
        body: { payer_id: payerId, bill_all_drafts: true, lines: [], roll_arrears: false },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["draft-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["payer-bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const wardOptions = wards?.results ?? [];
  const revenueItemOptions = revenueItems?.results ?? [];
  const isNonIndividual = form.payer_type !== "INDIVIDUAL";

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Payer Registry"
        actions={<Button onClick={() => setCreating(true)}>Register Payer</Button>}
      />

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, reference or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            emptyMessage="No payers enumerated yet."
            columns={[
              { header: "Ref", render: (r) => <span className="num">{r.payer_ref}</span> },
              { header: "Name", render: (r) => r.full_name },
              { header: "Type", render: (r) => r.payer_type },
              { header: "Phone", render: (r) => r.phone || "—" },
              { header: "KYC", render: (r) => <StatusTag status={r.kyc_status} /> },
            ]}
          />
        )}
      </div>

      {creating && (
        <Modal
          title="Register Payer"
          onClose={() => setCreating(false)}
          wide
          actions={
            <>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button disabled={createPayer.isPending} onClick={() => createPayer.mutate()}>
                {createPayer.isPending ? "Registering…" : "Register"}
              </Button>
            </>
          }
        >
          {formError && <div className="error-banner">{formError}</div>}
          <div className="form-grid">
            <label className="field">
              <span>Payer type</span>
              <select value={form.payer_type} onChange={(e) => setForm({ ...form, payer_type: e.target.value as typeof form.payer_type })}>
                {PAYER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Full name</span>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="field">
              <span>Ward</span>
              <select value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })}>
                <option value="">Select a ward…</option>
                {wardOptions.map((w) => (
                  <option key={w.id} value={w.id}>{w.ward_name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Address</span>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </label>
            {isNonIndividual ? (
              <>
                <label className="field">
                  <span>TIN</span>
                  <input value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} />
                </label>
                <label className="field">
                  <span>Business size (optional)</span>
                  <select value={form.business_size} onChange={(e) => setForm({ ...form, business_size: e.target.value as typeof form.business_size })}>
                    <option value="">—</option>
                    {BUSINESS_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label className="field">
                <span>NIN/BVN</span>
                <input value={form.nin_bvn_hash} onChange={(e) => setForm({ ...form, nin_bvn_hash: e.target.value })} />
              </label>
            )}
          </div>
          <label className="field">
            <span>Revenue items liable now (optional — recorded as draft assessments)</span>
            <select
              multiple
              size={Math.min(6, Math.max(3, revenueItemOptions.length))}
              value={form.revenue_item_ids.map(String)}
              onChange={(e) =>
                setForm({ ...form, revenue_item_ids: Array.from(e.target.selectedOptions, (o) => Number(o.value)) })
              }
            >
              {revenueItemOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.harmonised_code} — {item.item_name}
                </option>
              ))}
            </select>
          </label>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.full_name} onClose={() => setSelected(null)} wide>
          <div className="detail-grid">
            <div className="detail-item"><span className="label">Reference</span><span className="value num">{selected.payer_ref}</span></div>
            <div className="detail-item"><span className="label">Type</span><span className="value">{selected.payer_type}</span></div>
            <div className="detail-item"><span className="label">Phone</span><span className="value">{selected.phone || "—"}</span></div>
            <div className="detail-item"><span className="label">Address</span><span className="value">{selected.address || "—"}</span></div>
            <div className="detail-item"><span className="label">KYC status</span><span className="value"><StatusTag status={selected.kyc_status} /></span></div>
          </div>

          <div>
            <div className="page-header">
              <h2>Draft assessments</h2>
              {(draftAssessments?.length ?? 0) > 0 && (
                <Button disabled={issueHarmonizedBill.isPending} onClick={() => issueHarmonizedBill.mutate(selected.id)}>
                  {issueHarmonizedBill.isPending ? "Issuing…" : "Issue Harmonized Bill"}
                </Button>
              )}
            </div>
            <DataTable
              rows={draftAssessments ?? []}
              rowKey={(r) => r.id}
              emptyMessage="No draft assessments — nothing enumerated but unbilled."
              columns={[
                { header: "Item", render: (r) => `${r.harmonised_code} — ${r.item_name}` },
                { header: "Qty", render: (r) => r.quantity },
                { header: "Amount", render: (r) => <span className="num">₦{Number(r.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span> },
              ]}
            />
          </div>

          <div>
            <h2>Bills</h2>
            <DataTable
              rows={payerBills?.results ?? []}
              rowKey={(r) => r.id}
              emptyMessage="No bills issued yet."
              columns={[
                { header: "Bill Ref", render: (r) => <span className="num">{r.bill_ref}</span> },
                { header: "Total", render: (r) => <span className="num">₦{Number(r.total_amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span> },
                { header: "Balance", render: (r) => <span className="num">₦{Number(r.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span> },
                { header: "Status", render: (r) => <StatusTag status={r.status} /> },
              ]}
            />
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
