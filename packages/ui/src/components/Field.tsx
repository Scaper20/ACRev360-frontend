import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './Field.css';

export function Field({
  label,
  htmlFor,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label != null && <label htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}

/** Horizontal layout helper — children bottom-align (so a label-less field
 * lines up with labeled ones) and wrap at min 150px each. */
export function Row({ children }: { children: ReactNode }) {
  return <div className="row">{children}</div>;
}
