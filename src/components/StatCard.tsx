interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  accent?: "green" | "brass" | "teal";
}

const accentVar: Record<NonNullable<StatCardProps["accent"]>, string> = {
  green: "var(--green-600)",
  brass: "var(--brass)",
  teal: "var(--teal)",
};

export function StatCard({ label, value, delta, accent = "green" }: StatCardProps) {
  return (
    <div className="stat-tile" style={{ "--dot-color": accentVar[accent] } as React.CSSProperties}>
      <span className="label">{label}</span>
      <span className="value num">{value}</span>
      {delta && <span className="delta">{delta}</span>}
    </div>
  );
}
