import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import type { components } from "../api/schema";

type RevenueItem = components["schemas"]["CouncilRevenueItem"];

function formatNaira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function RevenueItemsPage() {
  const { user } = useAuth();
  const isAdmin = user?.access_level === "COUNCIL_ADMIN";
  const queryClient = useQueryClient();
  const [rateItem, setRateItem] = useState<RevenueItem | null>(null);
  const [newRate, setNewRate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["revenue-items"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/revenue-items");
      if (error) throw error;
      return data;
    },
  });

  const changeRate = useMutation({
    mutationFn: async (vars: { id: number; rate_amount: string }) => {
      const { data, error } = await api.POST("/api/v1/revenue-items/{id}/rate", {
        params: { path: { id: String(vars.id) } },
        body: { rate_amount: vars.rate_amount },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-items"] });
      setRateItem(null);
    },
    onError: () => setFormError("Couldn't update the rate. Check the amount and try again."),
  });

  const items = data?.results ?? [];
  const byCategory = new Map<string, RevenueItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category_name) ?? [];
    list.push(item);
    byCategory.set(item.category_name, list);
  }

  return (
    <AppShell>
      <PageHeader title="Revenue Items" />
      {isLoading && <p>Loading…</p>}
      {[...byCategory.entries()].map(([category, categoryItems]) => (
        <div className="card" key={category}>
          <h2>{category}</h2>
          <DataTable
            rows={categoryItems}
            rowKey={(row) => row.id}
            onRowClick={isAdmin ? (row) => { setRateItem(row); setNewRate(row.current_rate); setFormError(null); } : undefined}
            columns={[
              { header: "Code", render: (r) => <span className="num">{r.harmonised_code}</span> },
              { header: "Item", render: (r) => r.item_name },
              { header: "Unit", render: (r) => r.unit_of_charge },
              { header: "Current rate", render: (r) => <span className="num">{formatNaira(r.current_rate)}</span> },
            ]}
          />
        </div>
      ))}

      {rateItem && (
        <Modal
          title={`Change rate — ${rateItem.item_name}`}
          onClose={() => setRateItem(null)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setRateItem(null)}>Cancel</Button>
              <Button
                disabled={changeRate.isPending}
                onClick={() => changeRate.mutate({ id: rateItem.id, rate_amount: newRate })}
              >
                {changeRate.isPending ? "Saving…" : "Save new rate"}
              </Button>
            </>
          }
        >
          {formError && <div className="error-banner">{formError}</div>}
          <p>
            Current rate: <strong className="num">{formatNaira(rateItem.current_rate)}</strong>. Changing it closes
            this rate's history row and opens a new one — past assessments keep citing the old rate.
          </p>
          <label className="field">
            <span>New rate (₦)</span>
            <input type="number" min="0" step="0.01" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
          </label>
        </Modal>
      )}
    </AppShell>
  );
}
