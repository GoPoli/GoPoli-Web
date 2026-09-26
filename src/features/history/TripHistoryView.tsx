"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, Spinner, TripTypeBadge } from "@/components/ui";
import { fetchTripHistory } from "@/features/profile/api";
import type { TripHistoryItem } from "@/features/profile/types";
import { ApiError } from "@/lib/api/client";

export function TripHistoryView() {
  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(
    () =>
      fetchTripHistory()
        .then(setTrips)
        .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "No se pudo cargar el historial"))
        .finally(() => setLoading(false)),
    [],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return query();
  }, [query]);

  useEffect(() => {
    void query();
  }, [query]);

  if (loading) {
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
        <Button onClick={() => void reload()}>Reintentar</Button>
      </div>
    );
  }

  if (trips.length === 0) {
    return <EmptyState title="Aún no tienes viajes finalizados." />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 px-4 pb-28 pt-4 md:pb-10">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => void reload()}>
          Actualizar
        </Button>
      </div>
      {trips.map((trip) => (
        <Card key={trip.tripId} padding="md">
          <div className="mb-2.5 flex flex-wrap gap-2">
            <TripTypeBadge tripTypeLabel={trip.tripTypeLabel ?? "Viaje"} />
            <Badge tone="driver">{trip.myParticipationRoleLabel ?? "Pasajero"}</Badge>
          </div>
          <p className="text-[15px] font-semibold">
            {trip.departureLocationName ?? "Salida"} → {trip.arrivalLocationName ?? "Llegada"}
          </p>
          <p className="mt-1 text-[13px] text-[var(--gopoli-text-muted,#757575)]">
            {[trip.departureDate, trip.departureTime].filter(Boolean).join(" ")}
          </p>
          {trip.description ? <p className="mt-1.5 text-[13px]">{trip.description}</p> : null}
          <p className="mt-3 text-[13px] font-semibold">Participantes</p>
          <ul className="mt-1.5 space-y-1">
            {trip.participants.map((p, index) => (
              <li
                key={`${trip.tripId}-${index}-${p.userName}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">{p.userName}</span>
                <Badge tone={p.participationRoleLabel === "Conductor" ? "primary" : "neutral"}>
                  {p.participationRoleLabel}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
