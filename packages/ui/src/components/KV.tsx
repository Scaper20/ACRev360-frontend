import type { ReactNode } from 'react';
import './KV.css';

export function KV({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="kv">
      <span>{label}</span>
      <b>{children}</b>
    </div>
  );
}
