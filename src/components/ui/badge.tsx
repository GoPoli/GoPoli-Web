import type { HTMLAttributes } from "react";

export type BadgeTone = "primary" | "conductor" | "warning" | "neutral";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClass: Record<BadgeTone, string> = {
  primary:
    "border-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_35%,transparent)] bg-[color-mix(in_srgb,var(--gopoli-primary,#1B5E20)_10%,transparent)] text-[var(--gopoli-primary,#1B5E20)]",
  conductor:
    "border-[color-mix(in_srgb,#1565C0_35%,transparent)] bg-[color-mix(in_srgb,#1565C0_10%,transparent)] text-[#1565C0]",
  warning:
    "border-[var(--gopoli-accent,#FFC107)] bg-[color-mix(in_srgb,var(--gopoli-accent,#FFC107)_20%,transparent)] text-[var(--gopoli-primary,#1B5E20)]",
  neutral:
    "border-[var(--gopoli-border,#E0E0E0)] bg-[#F5F5F5] text-[var(--gopoli-text-muted,#757575)]",
};

export function Badge({
  tone = "primary",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-semibold",
        toneClass[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}

export type TripTypeBadgeProps = {
  tripTypeLabel?: string | null;
  idTipoServicio?: number | string | null;
  className?: string;
};

/** Equivalente a Flutter `TripTypeBadge`. */
export function TripTypeBadge({
  tripTypeLabel,
  idTipoServicio,
  className = "",
}: TripTypeBadgeProps) {
  const id =
    typeof idTipoServicio === "number"
      ? idTipoServicio
      : idTipoServicio != null
        ? Number.parseInt(String(idTipoServicio), 10)
        : NaN;

  const label =
    tripTypeLabel && tripTypeLabel.length > 0
      ? tripTypeLabel
      : id === 3
        ? "Grupo conductor"
        : "Grupo de viaje";

  const isConductor =
    id === 3 || label.toLowerCase().includes("conductor");

  return (
    <Badge tone={isConductor ? "conductor" : "primary"} className={className}>
      {label}
    </Badge>
  );
}

export type RatingBadgeProps = {
  nota?: number | null;
  className?: string;
};

/** Equivalente a Flutter `RatingBadge`. */
export function RatingBadge({ nota, className = "" }: RatingBadgeProps) {
  const valor = nota ?? 0;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border border-[var(--gopoli-accent,#FFC107)]",
        "bg-[color-mix(in_srgb,var(--gopoli-accent,#FFC107)_20%,transparent)] px-3 py-1.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[18px] fill-[var(--gopoli-accent,#FFC107)]"
        aria-hidden
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      <span className="text-sm font-bold text-[var(--gopoli-primary,#1B5E20)]">
        {valor.toFixed(1)}
      </span>
    </span>
  );
}
