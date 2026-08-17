import type { ReactNode } from 'react';
import './Tag.css';

export type TagVariant = 'ok' | 'warn' | 'bad' | 'neutral' | 'brass';

export function Tag({ variant, children }: { variant: TagVariant; children: ReactNode }) {
  return <span className={`tag tag-${variant}`}>{children}</span>;
}
