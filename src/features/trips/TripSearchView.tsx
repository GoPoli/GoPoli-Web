"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Spinner, TripTypeBadge } from "@/components/ui";
import { getSessionUserId } from "@/features/auth/session";
import { fetchActiveTrips, joinTrip } from "./api";
import type { Trip } from "./types";
import { useUserTrips } from "./use-user-trips";

export function TripSearchView() {
  const router = useRouter();
  const { activeTripId, inProgressTripId, refresh: refreshUserTrips } = useUserTrips();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const query = useCallback(
    () =>
      fetchActiveTrips()
        .then(async (list) => {
          setTrips(list);
          await refreshUserTrips();
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error al cargar servicios activos"))
        .finally(() => setLoading(false)),
    [refreshUserTrips],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return query();
  }, [query]);

  useEffect(() => {
    void query();
  }, [query]);

  async function onJoin(tripId: number) {
    if (getSessionUserId() == null) {
      setToast("No hay sesión activa");
      return;
    }
    setJoiningId(tripId);
    try {
      await joinTrip(tripId);
      router.push(`/groups/${tripId}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
      {inProgressTripId != null ? (
        <Link
          href={`/map?trip=${inProgressTripId}`}
          className="flex items-center gap-2.5 bg-[var(--gopoli-secondary,#2E7D32)] px-4 py-3 text-sm font-semibold text-white"
        >
          <span aria-hidden>🗺</span>
          <span className="flex-1">Viaje en curso — Ver ruta en el mapa (Inicio)</span>
          <span aria-hidden>↗</span>
        </Link>
      ) : null}

      {toast ? (
        <div className="mx-4 mt-3 rounded-[10px] bg-[#FFF3E0] px-3 py-2 text-sm text-[#BF360C] md:mx-6" role="status">
          {toast}
          <button type="button" className="ml-2 underline" onClick={() => setToast(null)}>
            Cerrar
          </button>
        </div>
      ) : null}

      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Cargando servicios…" />
          </div>
        ) : error ? (
          <EmptyState title={error} action={<Button onClick={() => void reload()}>Reintentar</Button>} />
        ) : trips.length === 0 ? (
          <EmptyState
            title="No hay servicios activos"
            description="¡Crea el primero! Desliza o pulsa actualizar."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => void reload()}>Actualizar</Button>
                <Button variant="secondary" onClick={() => router.push("/map")}>
                  Crear servicio
                </Button>
              </div>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Card>
                  <TripTypeBadge tripTypeLabel={trip.tripTypeLabel} tripTypeId={trip.tripTypeId} />
                  <p className="mt-2 text-xs text-[var(--gopoli-text-muted,#757575)]">
                    {trip.departureDate} — {trip.departureTime}
                  </p>
                  {trip.description ? (
                    <p className="mt-2 text-sm text-[var(--foreground,#171717)]">{trip.description}</p>
                  ) : null}
                  <Button
                    fullWidth
                    className="mt-3"
                    loading={joiningId === trip.id}
                    onClick={() => void onJoin(trip.id)}
                  >
                    Unirse
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky bottom-20 z-10 flex flex-col items-end gap-3 p-4 md:bottom-6">
        {inProgressTripId != null ? (
          <Link href={`/map?trip=${inProgressTripId}`}>
            <Button variant="secondary" leftIcon={<span aria-hidden>🗺</span>}>
              Ver ruta del viaje
            </Button>
          </Link>
        ) : activeTripId != null ? (
          <>
            <Link href={`/groups/${activeTripId}`}>
              <Button variant="secondary" leftIcon={<span aria-hidden>👥</span>}>
                Ver mi grupo
              </Button>
            </Link>
            <Link href="/map">
              <Button size="sm" aria-label="Ir al mapa">
                🗺
              </Button>
            </Link>
          </>
        ) : (
          <Link href="/map">
            <Button leftIcon={<span aria-hidden>+</span>}>Crear servicio</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
