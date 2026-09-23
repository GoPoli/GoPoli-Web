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
import {
  CrearServicioForm,
  fetchServicio,
  useEstadoViajesUsuario,
  type LatLng,
} from "@/features/servicios";
import {
  fetchUbicaciones,
  findUbicacionById,
  latLngForUbicacion,
} from "@/features/catalogo";
import { GoPoliMap } from "./GoPoliMap";
import { rutaEntre } from "./route-service";
import type { LatLngLiteral, MapMarker } from "./types";

export function InicioMapaView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viajeParam = searchParams.get("viaje");

  const {
    idServicioActivo,
    idServicioEnCurso,
    refrescar,
  } = useEstadoViajesUsuario();

  const [destinoQuery, setDestinoQuery] = useState("");
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routePath, setRoutePath] = useState<LatLngLiteral[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("peek");
  const [hasSelection, setHasSelection] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);

  const mensajeBloqueo = useMemo(() => {
    if (idServicioActivo != null) {
      return "Ya tienes un servicio activo. En la pestaña Viajes abre “Mi grupo” y, si eres creador, cancela o finaliza el viaje para poder crear otro.";
    }
    return null;
  }, [idServicioActivo]);

  const aplicarSalidaLlegada = useCallback(
    async (
      salida: LatLng | null,
      llegada: LatLng | null,
      esViajeEnCurso: boolean,
    ) => {
      const next: MapMarker[] = [];
      if (salida) {
        next.push({
          id: "salida",
          position: salida,
          title: esViajeEnCurso ? "Salida del viaje" : "Salida",
          color: "green",
        });
      }
      if (llegada) {
        next.push({
          id: "llegada",
          position: llegada,
          title: esViajeEnCurso ? "Destino del viaje" : "Llegada",
          color: "amber",
        });
      }
      let ruta: LatLngLiteral[] = [];
      let failed = false;
      if (salida && llegada) {
        try {
          ruta = await rutaEntre(salida, llegada);
          if (ruta.length < 2) failed = true;
        } catch {
          failed = true;
        }
      }
      setMarkers(next);
      setRoutePath(ruta);
      setRouteFailed(failed);
      setHasSelection(Boolean(salida || llegada));
      if (salida && llegada && !esViajeEnCurso) {
        setSheetSnap((s) => (s === "peek" ? "half" : s));
      }
    },
    [],
  );

  const mostrarRutaServicio = useCallback(
    async (idServicio: number) => {
      try {
        const s = await fetchServicio(idServicio);
        if (!s) return;
        const ubicaciones = await fetchUbicaciones();
        const salidaU = findUbicacionById(ubicaciones, s.idLugarSalida);
        const llegadaU = findUbicacionById(ubicaciones, s.idLugarLlegada);
        const salida = salidaU ? latLngForUbicacion(salidaU) : null;
        const llegada = llegadaU ? latLngForUbicacion(llegadaU) : null;
        await aplicarSalidaLlegada(salida, llegada, true);
      } catch {
        /* ignore */
      }
    },
    [aplicarSalidaLlegada],
  );

  useEffect(() => {
    if (viajeParam) {
      const id = Number.parseInt(viajeParam, 10);
      if (Number.isFinite(id)) {
        void mostrarRutaServicio(id);
      }
    } else if (idServicioEnCurso != null) {
      void mostrarRutaServicio(idServicioEnCurso);
    }
  }, [viajeParam, idServicioEnCurso, mostrarRutaServicio]);

  const onCoordenadas = useCallback(
    (
      salida: LatLng | null,
      llegada: LatLng | null,
      avisoMsg?: string,
    ) => {
      if (avisoMsg) setAviso(avisoMsg);
      else setAviso(null);
      void aplicarSalidaLlegada(salida, llegada, false);
    },
    [aplicarSalidaLlegada],
  );

  function onServicioCreado(idServicio: number) {
    void refrescar();
    router.push(`/grupo/${idServicio}`);
  }

  const tripKind: TripUiKind = useMemo(() => {
    if (aviso || routeFailed) return "route_error";
    if (sinResultados) return "no_results";
    if (idServicioEnCurso != null) return "in_progress";
    if (idServicioActivo != null) return "active_group";
    if (hasSelection && markers.length >= 2) return "planning";
    return "empty";
  }, [
    aviso,
    routeFailed,
    sinResultados,
    idServicioEnCurso,
    idServicioActivo,
    hasSelection,
    markers.length,
  ]);

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

  return (
    <div className="relative h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <GoPoliMap markers={markers} routePath={routePath} />
      </div>

      <div className="pointer-events-none relative z-30 flex w-full min-w-0 flex-col gap-2 p-3 md:max-w-md md:p-4">
        {idServicioEnCurso != null ? (
          <TripStatusBanner
            kind="in_progress"
            serviceId={idServicioEnCurso}
            onShowRoute={() => void mostrarRutaServicio(idServicioEnCurso)}
          />
        ) : idServicioActivo != null ? (
          <TripStatusBanner kind="active_group" serviceId={idServicioActivo} />
        ) : null}

        <OriginDestStack
          originHint={
            markers.find((m) => m.id === "salida")?.title ??
            "Salida (elige en la hoja)"
          }
        >
          <SearchPill
            value={destinoQuery}
            onChange={(v) => {
              setDestinoQuery(v);
              setSinResultados(false);
              if (v.trim()) setSheetSnap((s) => (s === "peek" ? "half" : s));
            }}
            onClear={() => setSinResultados(false)}
          />
        </OriginDestStack>

        {aviso || routeFailed ? (
          <TripStatusBanner
            kind="route_error"
            message={
              aviso ??
              "No se pudo trazar la ruta entre esos puntos. Prueba otras ubicaciones."
            }
            onDismissError={() => {
              setAviso(null);
              setRouteFailed(false);
            }}
          />
        ) : null}

        {sinResultados ? <TripStatusBanner kind="no_results" /> : null}
      </div>

      <BottomSheet.Root
        id="panel-crear-servicio"
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
      >
        <BottomSheet.Handle />
        <BottomSheet.PeekSummary>
          <TripSheetSummary
            title={peekTitle}
            subtitle={peekSubtitle}
            signalLabel={
              tripKind === "planning" || tripKind === "in_progress"
                ? "Destino marcado"
                : null
            }
          />
        </BottomSheet.PeekSummary>

        <BottomSheet.Header>
          <div
            className={
              sheetSnap === "peek" ? "hidden md:block" : undefined
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--gopoli-pine)]">
                  {tripKind === "in_progress"
                    ? "Viaje en curso"
                    : "Crear servicio"}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--gopoli-text-muted)]">
                  Elige salida y destino: la ruta usa las coordenadas del
                  servidor.
                </p>
              </div>
              {idServicioEnCurso != null || idServicioActivo != null ? (
                <Link
                  href={`/grupo/${idServicioEnCurso ?? idServicioActivo}`}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-[var(--gopoli-primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gopoli-primary)]"
                >
                  Ver grupo
                </Link>
              ) : null}
            </div>
          </div>
        </BottomSheet.Header>

        <BottomSheet.Body>
          <CrearServicioForm
            destinoQuery={destinoQuery}
            bloqueoCrearMensaje={mensajeBloqueo}
            onCoordenadasSeleccion={onCoordenadas}
            onServicioCreado={onServicioCreado}
            onFiltroSinResultados={setSinResultados}
            accionFija
          />
        </BottomSheet.Body>
      </BottomSheet.Root>
    </div>
  );
}
