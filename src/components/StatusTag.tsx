const OK = new Set([
  "PAID", "BALANCED", "ACTIVE", "VERIFIED", "MATCHED", "SETTLED", "APPROVED",
  "COMPUTED", "CLOSED", "CONFIRMED",
]);
const DANGER = new Set([
  "OVERDUE", "CANCELLED", "SUPERSEDED", "SUSPENDED", "EXCEPTION", "EXCEPTIONS",
  "DISPUTED", "FAULTY", "RETIRED", "EXITED", "FLAGGED", "FINAL_NOTICE",
  "ENFORCEMENT", "LEGAL", "FAILED", "REVERSED",
]);

function toneFor(status: string): "tag-ok" | "tag-warn" | "tag-danger" {
  if (OK.has(status)) return "tag-ok";
  if (DANGER.has(status)) return "tag-danger";
  return "tag-warn";
}

export function StatusTag({ status }: { status: string }) {
  return <span className={`tag ${toneFor(status)}`}>{status.replace(/_/g, " ")}</span>;
}
