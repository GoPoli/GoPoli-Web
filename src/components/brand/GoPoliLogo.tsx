import type { SVGProps } from "react";

export type GoPoliMarkProps = SVGProps<SVGSVGElement> & {
  /** `pine` = marca sobre papel; `inverse` = blanco sobre verde. */
  tone?: "pine" | "inverse";
};

/** Monograma: origen → arco → destino (ámbar). */
export function GoPoliMark({
  tone = "pine",
  className = "",
  ...rest
}: GoPoliMarkProps) {
  const stroke = tone === "inverse" ? "#FFFFFF" : "var(--gopoli-pine, #143528)";
  const origin = tone === "inverse" ? "#FFFFFF" : "var(--gopoli-pine, #143528)";
  const dest =
    tone === "inverse" ? "#FFFFFF" : "var(--gopoli-signal, #E6A317)";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={["shrink-0", className].filter(Boolean).join(" ")}
      aria-hidden
      {...rest}
    >
      <path
        d="M6.5 22.5C6.5 14.5 12.2 7.5 16 7.5c3.8 0 9.5 7 9.5 15"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="22.5" r="2.6" fill={origin} />
      <circle
        cx="25.5"
        cy="22.5"
        r="3.1"
        fill={dest}
        opacity={tone === "inverse" ? 0.95 : 1}
      />
      {tone === "inverse" ? (
        <circle cx="25.5" cy="22.5" r="1.35" fill="var(--gopoli-signal, #E6A317)" />
      ) : null}
    </svg>
  );
}

export type GoPoliWordmarkProps = {
  className?: string;
  tone?: "pine" | "inverse";
};

export function GoPoliWordmark({
  className = "",
  tone = "pine",
}: GoPoliWordmarkProps) {
  return (
    <span
      className={[
        "font-display font-medium tracking-[-0.03em] leading-none",
        tone === "inverse"
          ? "text-white"
          : "text-[var(--gopoli-pine,#143528)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      GoPoli
    </span>
  );
}

export type GoPoliBrandProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  tone?: "pine" | "inverse";
  /** Solo monograma, sin wordmark. */
  markOnly?: boolean;
};

/** Marca + wordmark horizontal (o solo marca). */
export function GoPoliBrand({
  className = "",
  markClassName = "size-7",
  wordmarkClassName = "text-xl",
  tone = "pine",
  markOnly = false,
}: GoPoliBrandProps) {
  return (
    <span
      className={["inline-flex items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <GoPoliMark tone={tone} className={markClassName} />
      {markOnly ? null : (
        <GoPoliWordmark tone={tone} className={wordmarkClassName} />
      )}
    </span>
  );
}
