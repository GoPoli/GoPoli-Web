"use client";

import Link from "next/link";
import { EditProfileForm } from "@/features/profile/EditProfileForm";

export default function EditProfilePage() {
  return (
    <div>
      <header className="bg-[var(--gopoli-primary,#1B5E20)] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/profile" className="rounded px-1 text-lg leading-none hover:bg-white/10" aria-label="Volver al perfil">
            ←
          </Link>
          <h1 className="text-lg font-semibold">Editar perfil</h1>
        </div>
      </header>
      <EditProfileForm />
    </div>
  );
}
