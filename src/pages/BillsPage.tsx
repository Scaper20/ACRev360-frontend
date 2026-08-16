import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StatusTag } from "../components/StatusTag";
import { Typeahead } from "../components/Typeahead";
import type { components } from "../api/schema";

type Payer = components["schemas"]["Payer"];

const STATUSES: components["schemas"]["StatusE25Enum"][] = [
  "ISSUED", "PART_PAID", "PAID", "OVERDUE", "CANCELLED", "SUPERSEDED",
];

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

interface LineDraft {
  revenue_item_id: number;
  quantity: number;
}

export function BillsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === "COUNCIL_ADMIN";
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [payer, setPayer] = useState<Payer | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [billAllDrafts, setBillAllDrafts] = useState(false);
  const [rollArrears, setRollArrears] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: revenueItems } = useQuery({
    queryKey: ["revenue-items"],
    queryFn: async () => (await api.GET("/api/v1/revenue-items")).data,
  });
  const revenueItemOptions = revenueItems?.results ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["bills", statusFilter],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bills", {
        params: { query: { status: statusFilter || undefined } },
      });
      if (error) throw error;
      return data;
    },
  });

  const { data: billDetail } = useQuery({
    queryKey: ["bill-detail", selectedBillId],
    enabled: selectedBillId != null,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bills/{id}/detail", {
        params: { path: { id: String(selectedBillId) } },
      });
      if (error) throw error;
      return data;
    },
  });

  function resetForm() {
    setPayer(null);
    setLines([]);
    setBillAllDrafts(false);
    setRollArrears(false);
    setDueDate("");
    setFormError(null);
  }

  const issueBill = useMutation({
    mutationFn: async () => {
      if (!payer) throw new Error("Select a payer first.");
      const { data, error } = await api.POST("/api/v1/bills", {
        body: {
          payer_id: payer.id,
          due_date: dueDate || undefined,
          lines: lines.map((l) => ({ revenue_item_id: l.revenue_item_id, quantity: String(l.quantity) })),
          bill_all_drafts: billAllDrafts,
          roll_arrears: rollArrears,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setCreating(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const message = (err as { error?: string })?.error ?? (err as Error)?.message ?? "Couldn't issue the bill.";
      setFormError(message);
    },
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="Assessment & e-Billing" actions={<Button onClick={() => setCreating(true)}>New Bill</Button>} />

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelectedBillId(r.id)}
            emptyMessage="No bills issued yet."
            columns={[
              { header: "Bill Ref", render: (r) => <span className="num">{r.bill_ref}</span> },
              { header: "Payer", render: (r) => r.full_name },
              { header: "Total", render: (r) => <span className="num">{naira(r.total_amount)}</span> },
              { header: "Balance", render: (r) => <span className="num">{naira(r.balance)}</span> },
              { header: "Due", render: (r) => r.due_date },
              { header: "Status", render: (r) => <StatusTag status={r.status} /> },
            ]}
          />
        )}
      </div>

      {creating && (
        <Modal
          title="New Bill"
          onClose={() => { setCreating(false); resetForm(); }}
          wide
          actions={
            <>
              <Button variant="ghost" onClick={() => { setCreating(false); resetForm(); }}>Cancel</Button>
              <Button disabled={issueBill.isPending || !payer} onClick={() => issueBill.mutate()}>
                {issueBill.isPending ? "Issuing…" : "Issue Bill"}
              </Button>
            </>
          }
        >
          {formError && <div className="error-banner">{formError}</div>}

          <label className="field">
            <span>Payer</span>
            {payer ? (
              <span className="selected-chip">
                {payer.full_name} ({payer.payer_ref})
                <button className="icon-btn" onClick={() => setPayer(null)} type="button">×</button>
              </span>
            ) : (
              <Typeahead<Payer>
                placeholder="Search by name, reference or phone…"
                search={async (q) => {
                  const { data } = await api.GET("/api/v1/payers", { params: { query: { q } } });
                  return data?.results ?? [];
                }}
                renderOption={(p) => `${p.full_name} (${p.payer_ref})`}
                onSelect={setPayer}
              />
            )}
          </label>

          <label className="field">
            <span>Due date (optional — defaults to the council's standard window)</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>

          <label className="checkbox-field">
            <input type="checkbox" checked={billAllDrafts} onChange={(e) => setBillAllDrafts(e.target.checked)} />
            <span>Roll up every draft assessment already enumerated for this payer ("Issue Harmonized Bill")</span>
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={rollArrears} onChange={(e) => setRollArrears(e.target.checked)} />
            <span>Consolidate prior arrears — bring forward this payer's other unpaid balances and supersede them</span>
          </label>

          <div>
            <div className="page-header">
              <h2>Hand-picked lines</h2>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setLines([...lines, { revenue_item_id: revenueItemOptions[0]?.id ?? 0, quantity: 1 }])}
              >
                + Add line
              </Button>
            </div>
            {lines.map((line, i) => (
              <div className="line-row" key={i}>
                <select
                  value={line.revenue_item_id}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], revenue_item_id: Number(e.target.value) };
                    setLines(next);
                  }}
                >
                  {revenueItemOptions.map((item) => (
                    <option key={item.id} value={item.id}>{item.harmonised_code} — {item.item_name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], quantity: Number(e.target.value) };
                    setLines(next);
                  }}
                />
                <button className="icon-btn" type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {billDetail && selectedBillId != null && (
        <BillDetailModal
          bill={billDetail}
          isAdmin={isAdmin}
          revenueItemOptions={revenueItemOptions}
          onClose={() => setSelectedBillId(null)}
        />
      )}
    </AppShell>
  );
}

function BillDetailModal({
  bill,
  isAdmin,
  revenueItemOptions,
  onClose,
}: {
  bill: components["schemas"]["BillDetail"];
  isAdmin: boolean;
  revenueItemOptions: components["schemas"]["CouncilRevenueItem"][];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [addingLine, setAddingLine] = useState(false);
  const [newItemId, setNewItemId] = useState<number | null>(null);
  const [newQty, setNewQty] = useState(1);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["bill-detail", bill.id] });
    queryClient.invalidateQueries({ queryKey: ["bills"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  const addLine = useMutation({
    mutationFn: async () => {
      if (!newItemId) return;
      const { error } = await api.POST("/api/v1/bills/{id}/lines", {
        params: { path: { id: String(bill.id) } },
        body: { revenue_item_id: newItemId, quantity: String(newQty) },
      });
      if (error) throw error;
    },
    onSuccess: () => { refresh(); setAddingLine(false); setNewItemId(null); setNewQty(1); },
  });

  const deleteLine = useMutation({
    mutationFn: async (lineId: number) => {
      const { error } = await api.DELETE("/api/v1/bills/{id}/lines/{line_id}", {
        params: { path: { id: String(bill.id), line_id: lineId } },
      });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return (
    <Modal title={bill.bill_ref} onClose={onClose} wide>
      <div className="detail-grid">
        <div className="detail-item"><span className="label">Payer</span><span className="value">{bill.full_name} ({bill.payer_ref})</span></div>
        <div className="detail-item"><span className="label">Status</span><span className="value"><StatusTag status={bill.status} /></span></div>
        <div className="detail-item"><span className="label">Total</span><span className="value num">{naira(bill.total_amount)}</span></div>
        <div className="detail-item"><span className="label">Paid</span><span className="value num">{naira(bill.amount_paid)}</span></div>
        <div className="detail-item"><span className="label">Balance</span><span className="value num">{naira(bill.balance)}</span></div>
        <div className="detail-item"><span className="label">Arrears</span><span className="value num">{naira(bill.arrears_amount)}</span></div>
        <div className="detail-item"><span className="label">Due date</span><span className="value">{bill.due_date}</span></div>
      </div>

      <div>
        <div className="page-header">
          <h2>Lines</h2>
          {isAdmin && bill.status !== "SUPERSEDED" && bill.status !== "CANCELLED" && (
            <Button variant="ghost" onClick={() => setAddingLine(true)}>+ Add line</Button>
          )}
        </div>
        {addingLine && (
          <div className="line-row">
            <select value={newItemId ?? ""} onChange={(e) => setNewItemId(Number(e.target.value))}>
              <option value="">Select item…</option>
              {revenueItemOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.harmonised_code} — {item.item_name}</option>
              ))}
            </select>
            <input type="number" min="1" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} />
            <Button disabled={!newItemId || addLine.isPending} onClick={() => addLine.mutate()}>Add</Button>
            <Button variant="ghost" onClick={() => setAddingLine(false)}>Cancel</Button>
          </div>
        )}
        <DataTable
          rows={bill.lines}
          rowKey={(l) => l.id}
          emptyMessage="No lines."
          columns={[
            { header: "Item", render: (l) => `${l.harmonised_code} — ${l.item_name}` },
            { header: "Qty", render: (l) => l.quantity },
            { header: "Amount", render: (l) => <span className="num">{naira(l.line_amount)}</span> },
            ...(isAdmin
              ? [{
                  header: "",
                  render: (l: components["schemas"]["BillLineDetail"]) => (
                    <button className="icon-btn" onClick={() => deleteLine.mutate(l.id)} disabled={deleteLine.isPending}>×</button>
                  ),
                }]
              : []),
          ]}
        />
      </div>
    </Modal>
  );
}
