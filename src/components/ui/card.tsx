import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClass = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
} as const;

export function Card({
  children,
  padding = "md",
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-[var(--gopoli-border,#C9D7CC)] bg-white shadow-[0_1px_0_rgba(20,53,40,0.04)]",
        paddingClass[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
  ...rest
}: CardHeaderProps) {
  return (
    <div
      className={["mb-3 flex items-start justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-[var(--foreground,#171717)]">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-[var(--gopoli-text-muted,#757575)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
