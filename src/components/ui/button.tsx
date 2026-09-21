import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--gopoli-primary,#1B5E20)] text-white hover:bg-[var(--gopoli-secondary,#2E7D32)] disabled:bg-[var(--gopoli-primary,#1B5E20)]/50",
  secondary:
    "bg-[var(--gopoli-secondary,#2E7D32)] text-white hover:opacity-90 disabled:opacity-50",
  outline:
    "bg-transparent text-[var(--gopoli-primary,#1B5E20)] border border-[var(--gopoli-primary,#1B5E20)] hover:bg-[var(--gopoli-primary,#1B5E20)]/5 disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50",
  ghost:
    "bg-transparent text-[var(--gopoli-primary,#1B5E20)] hover:bg-[var(--gopoli-primary,#1B5E20)]/8 disabled:opacity-50",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-[10px]",
  md: "h-12 px-4 text-[15px] rounded-[10px]",
  lg: "h-[52px] px-5 text-base rounded-[10px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block size-[1.15em] animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading ? rightIcon : null}
    </button>
  );
}
