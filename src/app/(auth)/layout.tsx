import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-[var(--foreground,#171717)]">
      {children}
    </div>
  );
}
