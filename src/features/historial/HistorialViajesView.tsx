"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  TripTypeBadge,
} from "@/components/ui";
import { obtenerHistorialViajes } from "@/features/perfil/api";
import { ApiException } from "@/features/perfil/errors";
import type { HistorialViaje } from "@/features/perfil/types";

export function HistorialViajesView() {
  const [viajes, setViajes] = useState<HistorialViaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await obtenerHistorialViajes();
      setViajes(lista);
    } catch (e) {
      setError(
        e instanceof ApiException
          ? e.message
          : "No se pudo cargar el historial",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Cargando historial…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-[var(--gopoli-text-muted,#757575)]">{error}</p>
        <Button onClick={() => void cargar()}>Reintentar</Button>
      </div>
    );
  }

  if (viajes.length === 0) {
    return (
      <EmptyState title="Aún no tienes viajes finalizados." />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 px-4 pb-28 pt-4 md:pb-10">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => void cargar()}>
          Actualizar
        </Button>
      </div>
      {viajes.map((v) => (
        <Card key={v.idServicio} padding="md">
          <div className="mb-2.5 flex flex-wrap gap-2">
            <TripTypeBadge tripTypeLabel={v.tripTypeLabel ?? "Viaje"} />
            <Badge tone="conductor">
              {v.miRolParticipacionLabel ?? "Pasajero"}
            </Badge>
          </div>
          <p className="text-[15px] font-semibold">
            {v.nombreSalida ?? "Salida"} → {v.nombreLlegada ?? "Llegada"}
          </p>
          <p className="mt-1 text-[13px] text-[var(--gopoli-text-muted,#757575)]">
            {[v.fecha, v.horaSalida].filter(Boolean).join(" ")}
          </p>
          {v.descripcion ? (
            <p className="mt-1.5 text-[13px]">{v.descripcion}</p>
          ) : null}
          <p className="mt-3 text-[13px] font-semibold">Participantes</p>
          <ul className="mt-1.5 space-y-1">
            {v.participantes.map((p, idx) => (
              <li
                key={`${v.idServicio}-${idx}-${p.nombreUsuario}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">{p.nombreUsuario}</span>
                <Badge
                  tone={
                    p.rolParticipacionLabel === "Conductor"
                      ? "primary"
                      : "neutral"
                  }
                >
                  {p.rolParticipacionLabel}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
