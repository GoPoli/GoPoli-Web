"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type TripUiKind =
  | "empty"
  | "planning"
  | "active_group"
  | "in_progress"
  | "route_error"
  | "no_results";

export type TripStatusBannerProps = {
  kind: TripUiKind;
  tripId?: number | null;
  message?: string | null;
  onShowRoute?: () => void;
  onDismissError?: () => void;
  className?: string;
};

function BannerShell({
  children,
  className = "",
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone: "pine" | "primary" | "signal" | "muted";
}) {
  const toneClass: Record<typeof tone, string> = {
    pine: "bg-[var(--gopoli-pine)] text-white",
    primary: "bg-[var(--gopoli-primary)] text-white",
    signal:
      "border border-[var(--gopoli-signal)]/40 bg-[var(--gopoli-mist)] text-[var(--gopoli-accent)]",
    muted:
      "border border-[var(--gopoli-border)] bg-white text-[var(--foreground)]",
  };
  return (
    <div
      className={[
        "pointer-events-auto flex min-h-11 items-stretch overflow-hidden rounded-2xl shadow-[var(--gopoli-float-shadow)]",
        toneClass[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      {children}
    </div>
  );
}

export function TripStatusBanner({
  kind,
  tripId,
  message,
  onShowRoute,
  onDismissError,
  className = "",
}: TripStatusBannerProps) {
  if (kind === "empty" || kind === "planning") {
    return null;
  }

  if (kind === "route_error" && message) {
    return (
      <BannerShell tone="muted" className={className}>
        <div className="flex flex-1 items-start gap-2 px-3.5 py-3 text-sm leading-snug">
          <span className="min-w-0 flex-1">{message}</span>
          {onDismissError ? (
            <button
              type="button"
              className="shrink-0 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
              onClick={onDismissError}
            >
              Cerrar
            </button>
          ) : null}
        </div>
      </BannerShell>
    );
  }

  if (kind === "no_results") {
    return (
      <BannerShell tone="signal" className={className}>
        <p className="flex flex-1 items-center px-3.5 py-3 text-sm">
          Sin resultados para esa búsqueda. Prueba otro nombre del campus.
        </p>
      </BannerShell>
    );
  }

  if (kind === "in_progress" && tripId != null) {
    return (
      <BannerShell tone="pine" className={className}>
        <button
          type="button"
          className="flex min-h-11 flex-1 items-center gap-2.5 px-3.5 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
          onClick={onShowRoute}
        >
          <span
            className="size-2 shrink-0 rounded-full bg-[var(--gopoli-signal)]"
            aria-hidden
          />
          <span className="flex-1">En viaje — ruta en el mapa</span>
        </button>
        <Link
          href={`/groups/${tripId}`}
          className="flex min-h-11 min-w-11 items-center justify-center px-3 text-sm font-medium hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
          aria-label="Ver grupo y acciones"
        >
          Grupo
        </Link>
      </BannerShell>
    );
  }

  if (kind === "active_group" && tripId != null) {
    return (
      <BannerShell tone="primary" className={className}>
        <Link
          href={`/groups/${tripId}`}
          className="flex min-h-11 flex-1 items-center gap-2.5 px-3.5 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
        >
          <span className="flex-1">Grupo activo — ver mi grupo</span>
          <span aria-hidden>›</span>
        </Link>
      </BannerShell>
    );
  }

  return null;
}

export type TripSheetSummaryProps = {
  title: string;
  subtitle?: string;
  capacityLabel?: string | null;
  timeLabel?: string | null;
  signalLabel?: string | null;
};

export function TripSheetSummary({
  title,
  subtitle,
  capacityLabel,
  timeLabel,
  signalLabel,
}: TripSheetSummaryProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-base font-semibold text-[var(--gopoli-pine)]">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-0.5 truncate text-sm text-[var(--gopoli-text-muted)]">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {signalLabel ? (
          <span className="font-semibold text-[var(--gopoli-accent)]">
            {signalLabel}
          </span>
        ) : null}
        {capacityLabel ? (
          <span className="text-[var(--gopoli-text-muted)]">{capacityLabel}</span>
        ) : null}
        {timeLabel ? (
          <span className="tabular-nums text-[var(--gopoli-secondary)]">
            {timeLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
