"use client";

import { use } from "react";
import { MensajesHiloView } from "@/features/mensajes";

type MensajesHiloPageProps = {
  params: Promise<{ id: string }>;
};

export default function MensajesHiloPage({ params }: MensajesHiloPageProps) {
  const { id } = use(params);
  const idServicio = Number.parseInt(id, 10);

  if (!Number.isFinite(idServicio)) {
    return (
      <p className="p-6 text-center text-sm text-red-600" role="alert">
        Identificador de chat no válido.
      </p>
    );
  }

  return <MensajesHiloView idServicio={idServicio} />;
}
