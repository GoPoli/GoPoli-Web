import Link from "next/link";
import { RegistroForm } from "@/features/auth/RegistroForm";

export default function RegistroPage() {
  return (
    <main className="min-h-dvh">
      <header className="flex h-14 items-center bg-[var(--gopoli-primary,#1B5E20)] px-4 text-white shadow-sm">
        <Link
          href="/login"
          className="mr-3 rounded px-2 py-1 text-sm font-medium hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Volver al inicio de sesión"
        >
          ←
        </Link>
        <h1 className="text-base font-semibold">Crear cuenta</h1>
      </header>
      <RegistroForm />
    </main>
  );
}
