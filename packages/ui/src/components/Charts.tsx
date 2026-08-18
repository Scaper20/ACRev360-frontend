import { money, shortDate } from '../format';
import './Charts.css';

export interface FlowSegment {
  key: string;
  label: string;
  amount: number;
  color: string;
}

/** Proportional flow strip + legend — e.g. collections split by channel.
 * Segments with a zero amount are dropped from the strip (flex-grow: 0 would
 * render as an invisible sliver) but nothing renders at all renders an empty
 * placeholder instead of a strip. */
export function FlowChart({ segments, emptyLabel }: { segments: FlowSegment[]; emptyLabel: string }) {
  const visible = segments.filter((s) => s.amount > 0);
  const total = visible.reduce((s, seg) => s + seg.amount, 0) || 1;

  return (
    <>
      <div className="flowstrip">
        {visible.length === 0 ? (
          <div style={{ background: 'var(--line-soft)', color: 'var(--ink-40)', flexGrow: 1 }}>{emptyLabel}</div>
        ) : (
          visible.map((s) => (
            <div key={s.key} style={{ flexGrow: s.amount, background: s.color }}>
              {Math.round((s.amount / total) * 100)}%
            </div>
          ))
        )}
      </div>
      <div className="flowlegend">
        {segments.map((s) => (
          <span key={s.key}>
            <span className="dot" style={{ background: s.color }} />
            {s.label} · {money(s.amount)}
          </span>
        ))}
      </div>
    </>
  );
}

export interface BarListRow {
  key: string | number;
  label: string;
  value: number;
}

/** Horizontal bar list scaled to its own largest value — e.g. top revenue
 * items by amount billed. */
export function BarList({ rows, emptyLabel }: { rows: BarListRow[]; emptyLabel: string }) {
  if (rows.length === 0) return <div className="empty">{emptyLabel}</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <>
      {rows.map((r) => (
        <div className="bar-row" key={r.key}>
          <div className="nm">{r.label}</div>
          <div className="track">
            <div className="fill" style={{ width: `${((r.value / max) * 100).toFixed(1)}%` }} />
          </div>
          <div className="amt num">{money(r.value)}</div>
        </div>
      ))}
    </>
  );
}

export interface TrendPoint {
  date: string;
  amount: number;
}

/** Daily bar trend — e.g. collections over the last 14 days. Bars get a
 * minimum visible height even at zero so the strip reads as "14 days", not
 * as missing data. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const max = Math.max(...points.map((p) => p.amount), 1);
  return (
    <div className="trend-chart">
      {points.map((p) => (
        <div className="trend-col" key={p.date}>
          <div
            className="trend-bar"
            title={`${shortDate(p.date)}: ${money(p.amount)}`}
            style={{ height: `${Math.max((p.amount / max) * 100, 2)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
