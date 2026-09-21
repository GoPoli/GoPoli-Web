"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { InicioMapaView } from "@/features/mapa";

function MapaPageInner() {
  return <InicioMapaView />;
}

export default function MapaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner label="Cargando mapa…" />
        </div>
      }
    >
      <MapaPageInner />
    </Suspense>
  );
}
