import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";

function naira(value: string): string {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function ReceiptsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/receipts");
      if (error) throw error;
      return data;
    },
  });

  const rows = data?.results ?? [];

  return (
    <AppShell>
      <PageHeader title="e-Receipts" />
      <p className="empty-state" style={{ textAlign: "left", padding: 0 }}>
        Every confirmed payment gets a receipt with a QR/SMS verification token — independently
        verifiable by anyone at <code>/verify/&lt;token&gt;</code>, no login required.
      </p>
      <div className="card">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage="No receipts yet."
            columns={[
              { header: "Receipt Ref", render: (r) => <span className="num">{r.receipt_ref}</span> },
              { header: "Bill Ref", render: (r) => <span className="num">{r.bill_ref}</span> },
              { header: "Amount", render: (r) => <span className="num">{naira(r.amount)}</span> },
              { header: "Verify token", render: (r) => <span className="num">{r.qr_token}</span> },
              { header: "Verified", render: (r) => r.verified_count },
              { header: "Issued", render: (r) => new Date(r.created_at).toLocaleString() },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}
