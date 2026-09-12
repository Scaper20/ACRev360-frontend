import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import './Modal.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

// Module-level stack of currently-open Modal instances, ordered by mount —
// several screens (e.g. PayerDetailModal's invite-ratepayer sub-dialog) open
// a second Modal on top of one that's already open. Escape/backdrop-click
// used to close EVERY open Modal at once (each instance had its own
// unconditional document keydown listener), discarding whatever the parent
// modal was showing along with the one the user actually meant to dismiss.
// Only the topmost (last-registered) instance responds now.
let openStack: symbol[] = [];

/** The app's one modal size (max-width 620px) — the original had no
 * size-variant classes, every modal used this same cap regardless of
 * content, so this doesn't take a size prop. */
export function Modal({ open, onClose, title, footer, children }: ModalProps) {
  const id = useRef(Symbol('modal')).current;

  useEffect(() => {
    if (!open) return;
    openStack.push(id);
    return () => {
      openStack = openStack.filter((x) => x !== id);
    };
  }, [open, id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, id]);

  function closeIfTopmost() {
    if (openStack[openStack.length - 1] === id) onClose();
  }

  if (!open) return null;
  return (
    <div className="modal-bg on" onClick={closeIfTopmost}>
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
