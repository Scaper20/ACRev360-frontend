import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'ghost' | 'brass';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  small?: boolean;
}

/** Primary/brass render as pills; ghost stays small-radius — a deliberate
 * hierarchy signal, not a style default (see DESIGN_BRIEF §4). Reserve
 * primary/brass for the one or two actions that matter on a screen. */
export function Button({ variant = 'ghost', small, className, ...rest }: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, small && 'btn-sm', className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
