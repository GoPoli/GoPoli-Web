"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [sheetOpen, setSheetOpen] = useState(false);

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
          color: "red",
        });
      }
      let ruta: LatLngLiteral[] = [];
      if (salida && llegada) {
        ruta = await rutaEntre(salida, llegada);
      }
      setMarkers(next);
      setRoutePath(ruta);
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
      void aplicarSalidaLlegada(salida, llegada, false);
    },
    [aplicarSalidaLlegada],
  );

  function onServicioCreado(idServicio: number) {
    void refrescar();
    router.push(`/grupo/${idServicio}`);
  }

  return (
    <div className="relative h-full min-h-0 w-full flex-1">
      <div className="absolute inset-0 z-0">
        <GoPoliMap markers={markers} routePath={routePath} />
      </div>

      <div className="pointer-events-none relative z-30 flex flex-col gap-2 p-3 md:p-4">
        {idServicioEnCurso != null ? (
          <div className="pointer-events-auto flex items-stretch overflow-hidden rounded-[10px] bg-[var(--gopoli-secondary,#2E7D32)] text-white shadow">
            <button
              type="button"
              className="flex flex-1 items-center gap-2.5 px-3.5 py-3 text-left text-sm font-semibold"
              onClick={() => void mostrarRutaServicio(idServicioEnCurso)}
            >
              <span aria-hidden>🗺</span>
              <span className="flex-1">Viaje en curso — Ruta en el mapa</span>
            </button>
            <Link
              href={`/grupo/${idServicioEnCurso}`}
              className="flex items-center px-3 hover:bg-black/10"
              aria-label="Grupo y acciones"
            >
              👥
            </Link>
          </div>
        ) : null}

        {idServicioActivo != null && idServicioEnCurso == null ? (
          <Link
            href={`/grupo/${idServicioActivo}`}
            className="pointer-events-auto flex items-center gap-2.5 rounded-[10px] bg-[var(--gopoli-primary,#1B5E20)] px-3.5 py-3 text-sm font-semibold text-white shadow"
          >
            <span aria-hidden>👥</span>
            <span className="flex-1">Tienes un grupo activo — Ver mi grupo</span>
            <span aria-hidden>›</span>
          </Link>
        ) : null}

        <div className="pointer-events-auto rounded-xl bg-white shadow-md">
          <label className="sr-only" htmlFor="destino-query">
            ¿A dónde vamos?
          </label>
          <div className="flex items-center gap-2 px-3">
            <span className="text-[var(--gopoli-primary,#1B5E20)]" aria-hidden>
              🔍
            </span>
            <input
              id="destino-query"
              type="search"
              placeholder="¿A dónde vamos?"
              value={destinoQuery}
              onChange={(e) => setDestinoQuery(e.target.value)}
              className="w-full border-0 bg-transparent py-3.5 text-[15px] outline-none placeholder:text-[#BDBDBD]"
            />
            {destinoQuery ? (
              <button
                type="button"
                aria-label="Limpiar"
                className="text-[var(--gopoli-text-muted,#757575)]"
                onClick={() => setDestinoQuery("")}
              >
                ×
              </button>
            ) : null}
          </div>
        </div>

        {aviso ? (
          <div
            className="pointer-events-auto rounded-[10px] bg-[#333] px-3 py-2 text-sm text-white"
            role="status"
          >
            {aviso}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => setAviso(null)}
            >
              Cerrar
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={[
          "absolute z-20 flex flex-col overflow-hidden bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.16)]",
          "inset-x-0 bottom-0 rounded-t-[20px]",
          "md:inset-x-auto md:bottom-auto md:right-4 md:top-24 md:w-[min(100%-2rem,420px)] md:rounded-2xl md:shadow-lg",
          sheetOpen
            ? "h-[50dvh] md:h-[min(70dvh,calc(100%-8rem))]"
            : "",
        ].join(" ")}
      >
        <button
          type="button"
          className="flex min-h-11 w-full shrink-0 flex-col items-stretch px-4 pb-2 pt-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gopoli-primary,#1B5E20)]"
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
          aria-controls="panel-crear-servicio"
        >
          <span
            className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#E0E0E0] md:hidden"
            aria-hidden
          />
          <span className="flex items-center gap-3">
            <span className="flex-1 text-base font-bold text-[var(--gopoli-primary,#1B5E20)]">
              Crear servicio
            </span>
            <span className="text-sm text-[var(--gopoli-text-muted,#757575)]" aria-hidden>
              {sheetOpen ? "▾" : "▴"}
            </span>
          </span>
        </button>
        <div
          id="panel-crear-servicio"
          hidden={!sheetOpen}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-2"
        >
            <p className="mb-4 text-[13px] leading-snug text-[var(--gopoli-text-muted,#757575)]">
              Elige salida y destino: la ruta en el mapa usa las coordenadas del
              servidor.
            </p>
            <CrearServicioForm
              destinoQuery={destinoQuery}
              bloqueoCrearMensaje={mensajeBloqueo}
              onCoordenadasSeleccion={onCoordenadas}
              onServicioCreado={onServicioCreado}
              accionFija
            />
        </div>
      </div>
    </div>
  );
}
