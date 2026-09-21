"use client";

import type { KeyboardEvent, MouseEvent } from "react";

export type ProfileAvatarProps = {
  /** Foto en base64 (con o sin prefijo data URL). */
  fotoBase64?: string | null;
  /** Radio en px (diámetro = radius * 2). Por defecto 50 como en Flutter. */
  radius?: number;
  alt?: string;
  onClick?: () => void;
  className?: string;
};

function decodeBase64Src(raw: string | null | undefined): string | null {
  if (!raw || raw.length === 0) return null;
  try {
    const data = raw.includes(",") ? raw.split(",").pop()! : raw;
    // Validar decodificación mínima
    atob(data.slice(0, Math.min(data.length, 32)));
    if (raw.startsWith("data:")) return raw;
    return `data:image/jpeg;base64,${data}`;
  } catch {
    return null;
  }
}

/** Equivalente a Flutter `ProfileAvatar`. */
export function ProfileAvatar({
  fotoBase64,
  radius = 50,
  alt = "Foto de perfil",
  onClick,
  className = "",
}: ProfileAvatarProps) {
  const src = decodeBase64Src(fotoBase64);
  const size = radius * 2;
  const interactive = typeof onClick === "function";

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  function handleClick(e: MouseEvent<HTMLElement>) {
    if (interactive) onClick();
    e.stopPropagation();
  }

  const sharedClass = [
    "inline-flex shrink-0 overflow-hidden rounded-full",
    interactive
      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary,#1B5E20)] focus-visible:ring-offset-2"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = { width: size, height: size };

  if (src) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element -- base64 avatars
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="size-full object-cover"
      />
    );
    if (interactive) {
      return (
        <button
          type="button"
          onClick={handleClick}
          onKeyDown={onKeyDown}
          className={sharedClass}
          style={style}
          aria-label={alt}
        >
          {img}
        </button>
      );
    }
    return (
      <span className={sharedClass} style={style}>
        {img}
      </span>
    );
  }

  const placeholder = (
    <span
      className="flex size-full items-center justify-center bg-[#FFE0B2]"
      aria-hidden={!interactive}
    >
      <svg
        viewBox="0 0 24 24"
        className="text-[#BCAAA4]"
        style={{ width: radius * 1.4, height: radius * 1.4 }}
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </span>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={onKeyDown}
        className={sharedClass}
        style={style}
        aria-label={alt}
      >
        {placeholder}
      </button>
    );
  }

  return (
    <span className={sharedClass} style={style} role="img" aria-label={alt}>
      {placeholder}
    </span>
  );
}
