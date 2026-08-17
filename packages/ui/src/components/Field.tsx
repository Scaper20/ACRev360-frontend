import type { InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cloneElement, isValidElement, useId } from 'react';
import './Field.css';

/** Generates and wires the label/input id pair automatically — most call
 * sites across the app were passing `label` without `htmlFor`, leaving the
 * label with no programmatic association to its input at all (visually
 * fine, but `<label>` and screen readers had no idea which field was which,
 * and it broke `getByLabel`-style lookups in tests). Auto-generating removes
 * the chance of a call site forgetting it; `htmlFor` is still accepted to
 * pin a specific id (e.g. for a `<label>` that needs to reference an input
 * rendered outside `children`). */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const field =
    isValidElement(children) && (children as ReactElement<{ id?: string }>).props.id == null
      ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId })
      : children;
  return (
    <div className="field">
      {label != null && <label htmlFor={fieldId}>{label}</label>}
      {field}
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
