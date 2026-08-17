import { useEffect } from 'react';
import './DocViewer.css';

export interface DocViewerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string | null;
}

/** The print-preview overlay — a second, distinct overlay from Modal (wider,
 * taller, darker scrim) reserved specifically for "Print Notice"/"Print
 * Bill". Print and view are strictly separate actions in this system; never
 * repoint a row's default click at this component (DESIGN_BRIEF §6). */
export function DocViewer({ open, onClose, title, src }: DocViewerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !src) return null;
  return (
    <div className="doc-bg on" onClick={onClose}>
      <div className="doc-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="doc-viewer-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => (document.getElementById('docViewerFrame') as HTMLIFrameElement | null)?.contentWindow?.print()}>
            Print
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <iframe id="docViewerFrame" title={title} src={src} />
      </div>
    </div>
  );
}
