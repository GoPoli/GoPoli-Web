"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { HomeMapView } from "@/features/map";

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Spinner label="Cargando mapa…" />
        </div>
      }
    >
      <HomeMapView />
    </Suspense>
  );
}
