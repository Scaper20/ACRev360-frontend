import type { ReactNode } from 'react';
import { useEffect } from 'react';
import './Modal.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/** The app's one modal size (max-width 620px) — the original had no
 * size-variant classes, every modal used this same cap regardless of
 * content, so this doesn't take a size prop. */
export function Modal({ open, onClose, title, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">{children}</div>
        {footer != null && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
