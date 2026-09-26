"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BottomSheet,
  OriginDestStack,
  SearchPill,
  TripSheetSummary,
  TripStatusBanner,
  type SheetSnap,
  type TripUiKind,
} from "@/components/ride";
import { CreateTripForm, fetchTrip, useUserTrips, type LatLng } from "@/features/trips";
import { fetchLocations, findLocationById, locationLatLng } from "@/features/catalog";
import { GoPoliMap } from "./GoPoliMap";
import { routeBetween } from "./route-service";
import type { LatLngLiteral, MapMarker } from "./types";

const ACTIVE_TRIP_MESSAGE =
  "Ya tienes un servicio activo. En la pestaña Viajes abre “Mi grupo” y, si eres creador, cancela o finaliza el viaje para poder crear otro.";

function tripMarkers(departure: LatLng | null, arrival: LatLng | null, inProgress: boolean): MapMarker[] {
  const markers: MapMarker[] = [];
  if (departure) {
    markers.push({
      id: "departure",
      position: departure,
      title: inProgress ? "Salida del viaje" : "Salida",
      color: "green",
    });
  }
  if (arrival) {
    markers.push({
      id: "arrival",
      position: arrival,
      title: inProgress ? "Destino del viaje" : "Llegada",
      color: "amber",
    });
  }
  return markers;
}

async function traceRoute(
  departure: LatLng | null,
  arrival: LatLng | null,
): Promise<{ path: LatLngLiteral[]; failed: boolean }> {
  if (!departure || !arrival) return { path: [], failed: false };
  try {
    const path = await routeBetween(departure, arrival);
    return { path, failed: path.length < 2 };
  } catch {
    return { path: [], failed: true };
  }
}

export function HomeMapView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripParam = searchParams.get("trip");

  const { activeTripId, inProgressTripId, refresh } = useUserTrips();

  const [destinationQuery, setDestinationQuery] = useState("");
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routePath, setRoutePath] = useState<LatLngLiteral[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("peek");
  const [hasSelection, setHasSelection] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const blockedMessage = useMemo(() => (activeTripId != null ? ACTIVE_TRIP_MESSAGE : null), [activeTripId]);

  const applyEndpoints = useCallback(
    (departure: LatLng | null, arrival: LatLng | null, inProgress: boolean) =>
      traceRoute(departure, arrival).then(({ path, failed }) => {
        setMarkers(tripMarkers(departure, arrival, inProgress));
        setRoutePath(path);
        setRouteFailed(failed);
        setHasSelection(Boolean(departure || arrival));
        if (departure && arrival && !inProgress) {
          setSheetSnap((s) => (s === "peek" ? "half" : s));
        }
      }),
    [],
  );

  const showTripRoute = useCallback(
    async (tripId: number) => {
      try {
        const trip = await fetchTrip(tripId);
        if (!trip) return;
        const locations = await fetchLocations();
        const departure = findLocationById(locations, trip.departureLocationId);
        const arrival = findLocationById(locations, trip.arrivalLocationId);
        await applyEndpoints(
          departure ? locationLatLng(departure) : null,
          arrival ? locationLatLng(arrival) : null,
          true,
        );
      } catch {
        // Sin ruta disponible: el mapa se queda con la vista actual.
      }
    },
    [applyEndpoints],
  );

  useEffect(() => {
    if (tripParam) {
      const id = Number.parseInt(tripParam, 10);
      if (Number.isFinite(id)) void showTripRoute(id);
    } else if (inProgressTripId != null) {
      void showTripRoute(inProgressTripId);
    }
  }, [tripParam, inProgressTripId, showTripRoute]);

  const onCoordinatesSelected = useCallback(
    (departure: LatLng | null, arrival: LatLng | null, message?: string) => {
      setWarning(message ?? null);
      void applyEndpoints(departure, arrival, false);
    },
    [applyEndpoints],
  );

  function onTripCreated(tripId: number) {
    void refresh();
    router.push(`/groups/${tripId}`);
  }

  const tripKind: TripUiKind = useMemo(() => {
    if (warning || routeFailed) return "route_error";
    if (noResults) return "no_results";
    if (inProgressTripId != null) return "in_progress";
    if (activeTripId != null) return "active_group";
    if (hasSelection && markers.length >= 2) return "planning";
    return "empty";
  }, [warning, routeFailed, noResults, inProgressTripId, activeTripId, hasSelection, markers.length]);

  const peekTitle =
    tripKind === "in_progress"
      ? "Viaje en curso"
      : tripKind === "active_group"
        ? "Grupo activo"
        : tripKind === "planning"
          ? "Confirmar viaje"
          : tripKind === "route_error"
            ? "No hay ruta"
            : "¿A dónde vas?";

  const peekSubtitle =
    tripKind === "empty"
      ? "Elige salida y destino para ver la ruta"
      : tripKind === "planning"
        ? "Revisa cupos, hora y confirma"
        : tripKind === "in_progress"
          ? "Sigue la ruta en el mapa"
          : tripKind === "active_group"
            ? "Abre el grupo para iniciar o unirte"
            : tripKind === "route_error"
              ? "Revisa las ubicaciones o la conexión"
              : undefined;

  const groupTripId = inProgressTripId ?? activeTripId;

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <GoPoliMap markers={markers} routePath={routePath} />
      </div>

      <div className="pointer-events-none relative z-30 flex w-full min-w-0 flex-col gap-2 p-3 md:max-w-md md:p-4">
        {inProgressTripId != null ? (
          <TripStatusBanner
            kind="in_progress"
            tripId={inProgressTripId}
            onShowRoute={() => void showTripRoute(inProgressTripId)}
          />
        ) : activeTripId != null ? (
          <TripStatusBanner kind="active_group" tripId={activeTripId} />
        ) : null}

        <OriginDestStack originHint={markers.find((m) => m.id === "departure")?.title ?? "Salida (elige en la hoja)"}>
          <SearchPill
            value={destinationQuery}
            onChange={(v) => {
              setDestinationQuery(v);
              setNoResults(false);
              if (v.trim()) setSheetSnap((s) => (s === "peek" ? "half" : s));
            }}
            onClear={() => setNoResults(false)}
          />
        </OriginDestStack>

        {warning || routeFailed ? (
          <TripStatusBanner
            kind="route_error"
            message={warning ?? "No se pudo trazar la ruta entre esos puntos. Prueba otras ubicaciones."}
            onDismissError={() => {
              setWarning(null);
              setRouteFailed(false);
            }}
          />
        ) : null}

        {noResults ? <TripStatusBanner kind="no_results" /> : null}
      </div>

      <BottomSheet.Root id="create-trip-panel" snap={sheetSnap} onSnapChange={setSheetSnap}>
        <BottomSheet.Handle />
        <BottomSheet.PeekSummary>
          <TripSheetSummary
            title={peekTitle}
            subtitle={peekSubtitle}
            signalLabel={tripKind === "planning" || tripKind === "in_progress" ? "Destino marcado" : null}
          />
        </BottomSheet.PeekSummary>

        <BottomSheet.Header>
          <div className={sheetSnap === "peek" ? "hidden md:block" : undefined}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--gopoli-pine)]">
                  {tripKind === "in_progress" ? "Viaje en curso" : "Crear servicio"}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--gopoli-text-muted)]">
                  Elige salida y destino: la ruta usa las coordenadas del servidor.
                </p>
              </div>
              {groupTripId != null ? (
                <Link
                  href={`/groups/${groupTripId}`}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-[var(--gopoli-primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
                >
                  Ver grupo
                </Link>
              ) : null}
            </div>
          </div>
        </BottomSheet.Header>

        <BottomSheet.Body>
          <CreateTripForm
            destinationQuery={destinationQuery}
            blockedMessage={blockedMessage}
            onCoordinatesSelected={onCoordinatesSelected}
            onTripCreated={onTripCreated}
            onNoResults={setNoResults}
            stickyAction
          />
        </BottomSheet.Body>
      </BottomSheet.Root>
    </div>
  );
}
