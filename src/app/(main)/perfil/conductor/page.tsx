"use client";

import Link from "next/link";
import { RegistroConductorForm } from "@/features/conductor/RegistroConductorForm";

export default function RegistroConductorPage() {
  return (
    <div>
      <header className="bg-[var(--gopoli-primary,#1B5E20)] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/perfil"
            className="rounded px-1 text-lg leading-none hover:bg-white/10"
            aria-label="Volver al perfil"
          >
            ←
          </Link>
          <h1 className="text-lg font-semibold">Registro de vehículo</h1>
        </div>
      </header>
      <RegistroConductorForm />
    </div>
  );
}
