"use client";

import { use } from "react";
import { GrupoView } from "@/features/grupos";

type GrupoPageProps = {
  params: Promise<{ id: string }>;
};

export default function GrupoPage({ params }: GrupoPageProps) {
  const { id } = use(params);
  const idServicio = Number.parseInt(id, 10);

  if (!Number.isFinite(idServicio)) {
    return (
      <p className="p-6 text-center text-sm text-red-600" role="alert">
        Identificador de grupo no válido.
      </p>
    );
  }

  return <GrupoView idServicio={idServicio} />;
}
