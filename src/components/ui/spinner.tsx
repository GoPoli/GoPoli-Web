import type { HTMLAttributes, ReactNode } from "react";

export type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizeMap = {
  sm: "size-5 border-2",
  md: "size-8 border-[2.5px]",
  lg: "size-10 border-[3px]",
} as const;

export function Spinner({
  size = "md",
  label = "Cargando…",
  className = "",
  ...rest
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={["inline-flex items-center justify-center", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span
        className={[
          "animate-spin rounded-full border-[var(--gopoli-primary,#1B5E20)] border-r-transparent",
          sizeMap[size],
        ].join(" ")}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <div className="mb-4 text-[#E0E0E0]" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="text-base text-[var(--gopoli-text-muted,#757575)]">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-[var(--gopoli-text-muted,#757575)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
