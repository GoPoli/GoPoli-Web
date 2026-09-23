"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export type SearchPillProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  leading?: ReactNode;
  className?: string;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "placeholder"
  >;
};

/** Píldora flotante de búsqueda (origen/destino) sobre el mapa. */
export function SearchPill({
  id = "destino-query",
  label = "¿A dónde vas?",
  value,
  onChange,
  onClear,
  placeholder = "¿A dónde vas?",
  leading,
  className = "",
  inputProps,
}: SearchPillProps) {
  return (
    <div
      className={[
        "pointer-events-auto flex min-h-11 items-center gap-2.5 rounded-full",
        "border border-[var(--gopoli-mist,#E7F2EA)] bg-white/95 px-3.5",
        "shadow-[var(--gopoli-float-shadow)] backdrop-blur-sm",
        "transition-shadow duration-200 ease-out",
        "focus-within:ring-2 focus-within:ring-[var(--gopoli-signal,#E6A317)] focus-within:ring-offset-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {leading ?? (
        <span
          className="flex size-2.5 shrink-0 rounded-full bg-[var(--gopoli-signal,#E6A317)]"
          aria-hidden
        />
      )}
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base leading-normal text-[var(--foreground)] outline-none placeholder:text-[var(--gopoli-text-muted,#4E6156)]"
        autoComplete="off"
        enterKeyHint="search"
        {...inputProps}
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--gopoli-text-muted)] transition-colors hover:bg-[var(--gopoli-mist)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      ) : null}
    </div>
  );
}

export type OriginDestStackProps = {
  originHint?: string;
  children: ReactNode;
  className?: string;
};

/** Origen (mute) encima de la píldora de destino. */
export function OriginDestStack({
  originHint = "Tu ubicación o salida",
  children,
  className = "",
}: OriginDestStackProps) {
  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      <p className="pointer-events-none px-3 text-xs text-[var(--gopoli-text-muted,#4E6156)]">
        <span
          className="mr-1.5 inline-block size-1.5 rounded-full bg-[var(--gopoli-secondary,#2F6B45)] align-middle"
          aria-hidden
        />
        {originHint}
      </p>
      {children}
    </div>
  );
}
