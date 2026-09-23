"use client";

import {
  createContext,
  use,
  useCallback,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type SheetSnap = "peek" | "half" | "full";

type SheetContextValue = {
  snap: SheetSnap;
  setSnap: (next: SheetSnap) => void;
  cycleSnap: () => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheet(): SheetContextValue {
  const ctx = use(SheetContext);
  if (!ctx) {
    throw new Error("BottomSheet.* debe usarse dentro de BottomSheet.Root");
  }
  return ctx;
}

const SNAP_ORDER: SheetSnap[] = ["peek", "half", "full"];

const snapClassMobile: Record<SheetSnap, string> = {
  peek: "max-md:h-[8rem]",
  half: "max-md:h-[min(48dvh,26rem)]",
  full: "max-md:h-[min(78dvh,40rem)]",
};

export type BottomSheetRootProps = {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  children: ReactNode;
  className?: string;
  id?: string;
};

function Root({
  snap,
  onSnapChange,
  children,
  className = "",
  id,
}: BottomSheetRootProps) {
  const setSnap = useCallback(
    (next: SheetSnap) => {
      onSnapChange(next);
    },
    [onSnapChange],
  );

  const cycleSnap = useCallback(() => {
    const i = SNAP_ORDER.indexOf(snap);
    const next = SNAP_ORDER[(i + 1) % SNAP_ORDER.length]!;
    onSnapChange(next);
  }, [onSnapChange, snap]);

  const value = useMemo(
    () => ({ snap, setSnap, cycleSnap }),
    [snap, setSnap, cycleSnap],
  );

  return (
    <SheetContext value={value}>
      <aside
        id={id}
        className={[
          "gopoli-sheet pointer-events-auto absolute z-20 flex flex-col overflow-hidden",
          "inset-x-0 bottom-0 rounded-t-[1.25rem]",
          "border border-[var(--gopoli-mist,#E7F2EA)] border-b-0 bg-[var(--gopoli-paper,#F7FBF8)]",
          "shadow-[var(--gopoli-sheet-shadow)]",
          "transition-[transform,opacity] duration-200 ease-out",
          "motion-reduce:transition-none",
          snapClassMobile[snap],
          /* Desktop: panel lateral estrecho */
          "md:inset-x-auto md:bottom-4 md:right-4 md:top-24 md:flex md:h-auto md:max-h-[calc(100%-7rem)] md:min-h-[22rem]",
          "md:w-[min(100%-2rem,22.5rem)] md:rounded-2xl md:border-b",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        data-snap={snap}
      >
        {children}
      </aside>
    </SheetContext>
  );
}

function Handle({ className = "" }: { className?: string }) {
  const { snap, cycleSnap } = useSheet();
  return (
    <button
      type="button"
      className={[
        "flex min-h-11 w-full shrink-0 flex-col items-center justify-center px-4 pt-2 md:hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gopoli-primary)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={cycleSnap}
      aria-label={
        snap === "peek"
          ? "Expandir hoja"
          : snap === "half"
            ? "Expandir hoja completa"
            : "Reducir hoja"
      }
      aria-expanded={snap !== "peek"}
    >
      <span
        className="h-1 w-10 rounded-full bg-[var(--gopoli-border,#C9D7CC)]"
        aria-hidden
      />
    </button>
  );
}

function Header({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["shrink-0 px-4 pb-2 pt-1 md:pt-4", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

function Body({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  const { snap } = useSheet();
  return (
    <div
      className={[
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2",
        snap === "peek" ? "hidden md:block" : "",
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

function Footer({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "shrink-0 border-t border-[var(--gopoli-mist,#E7F2EA)] bg-[var(--gopoli-paper,#F7FBF8)] px-4 py-3",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
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

function PeekSummary({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { snap, setSnap } = useSheet();
  if (snap !== "peek") return null;
  return (
    <button
      type="button"
      className={[
        "flex w-full flex-1 items-start px-4 pb-3 text-left md:hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gopoli-primary)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => setSnap("half")}
    >
      {children}
    </button>
  );
}

export const BottomSheet = {
  Root,
  Handle,
  Header,
  Body,
  Footer,
  PeekSummary,
  useSheet,
};
