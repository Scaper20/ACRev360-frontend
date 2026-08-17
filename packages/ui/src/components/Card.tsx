import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['card', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export type StatAccent = 'default' | 'accent' | 'info';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  accent?: StatAccent;
  small?: boolean;
}

/** Stat tiles override .card's 3px green top edge down to a plain hairline,
 * on purpose — a quieter corner dot instead, so four in a row don't compete
 * (DESIGN_BRIEF §5). `accent="accent"` (brass) marks the page's primary
 * metric; `accent="info"` (teal) is one of this system's ~2-3 sanctioned
 * teal uses — don't add a fourth without a reason as specific as those two. */
export function StatCard({ label, value, delta, accent = 'default', small }: StatCardProps) {
  return (
    <div className={['card', 'stat', accent !== 'default' && `stat-${accent}`].filter(Boolean).join(' ')}>
      <div className="stat-label">{label}</div>
      <div className={['stat-value', small && 'stat-value-small'].filter(Boolean).join(' ')}>{value}</div>
      {delta != null && <div className="stat-delta">{delta}</div>}
    </div>
  );
}
