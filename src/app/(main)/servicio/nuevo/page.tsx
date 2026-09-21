"use client";

import { useRouter } from "next/navigation";
import { CrearServicioForm } from "@/features/servicios";

export default function ServicioNuevoPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-xl p-4 md:p-6">
      <h1 className="mb-6 text-xl font-bold text-[var(--gopoli-primary,#1B5E20)]">
        Crear Servicio
      </h1>
      <CrearServicioForm
        onServicioCreado={(idServicio) => {
          router.replace(`/grupo/${idServicio}`);
        }}
      />
    </div>
  );
}
