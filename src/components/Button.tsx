import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "btn-primary" : "btn-ghost";
  return <button className={`btn ${variantClass} ${className}`} {...props} />;
}
