import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import './Toast.css';

interface ToastItem {
  id: number;
  message: string;
  bad: boolean;
}

type ToastFn = (message: string, bad?: boolean) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const fn = useContext(ToastContext);
  if (!fn) throw new Error('useToast() must be used within a <ToastProvider>');
  return fn;
}

/** Auto-dismisses after 3800ms, no exit animation — matches the original
 * exactly (a plain removal, not a fade-out). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback<ToastFn>((message, bad = false) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, message, bad }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast">
        {items.map((t) => (
          <div key={t.id} className={['toast', t.bad && 'toast-bad'].filter(Boolean).join(' ')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
