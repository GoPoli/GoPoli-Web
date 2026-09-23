import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh min-w-0 overflow-x-hidden bg-[var(--gopoli-paper)] text-[var(--foreground)]">
      {children}
    </div>
  );
}
