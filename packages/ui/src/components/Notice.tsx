import type { ReactNode } from 'react';
import './Notice.css';

export type NoticeVariant = 'default' | 'info' | 'bad';

export function Notice({ variant = 'default', children }: { variant?: NoticeVariant; children: ReactNode }) {
  return <div className={`notice notice-${variant}`}>{children}</div>;
}
