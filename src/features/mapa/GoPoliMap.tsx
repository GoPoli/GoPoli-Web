"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as LeafletMap, Polyline } from "leaflet";
import { EmptyState } from "@/components/ui";
import type { LatLngLiteral, MapMarker } from "./types";

const CENTRO_MEDELLIN: LatLngLiteral = { lat: 6.2476, lng: -75.5658 };
const VERDE_PRIMARIO = "#1B5E20";

type LeafletNs = typeof import("leaflet");

export type GoPoliMapProps = {
  markers?: MapMarker[];
  routePath?: LatLngLiteral[];
  className?: string;
  onReady?: () => void;
};

function leafletNs(mod: LeafletNs & { default?: LeafletNs }): LeafletNs {
  return mod.default ?? mod;
}

/** Mapa con teselas de OpenStreetMap (Leaflet). */
export function GoPoliMap({
  markers = [],
  routePath = [],
  className = "",
  onReady,
}: GoPoliMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletNs | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);
  const polylineRef = useRef<Polyline | null>(null);
  const readyOnce = useRef(false);
  const [mapEpoch, setMapEpoch] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      try {
        const mod = await import("leaflet");
        await import("leaflet/dist/leaflet.css");
        if (cancelled || !containerRef.current || mapRef.current) return;
        const L = leafletNs(mod);
        leafletRef.current = L;

        const map = L.map(containerRef.current, {
          center: [CENTRO_MEDELLIN.lat, CENTRO_MEDELLIN.lng],
          zoom: 12,
          zoomControl: true,
        });
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          },
        );
        tiles.addTo(map);
        mapRef.current = map;
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(containerRef.current);
        map.invalidateSize();
        setMapEpoch((n) => n + 1);
        if (!readyOnce.current) {
          readyOnce.current = true;
          onReady?.();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "leaflet-init-failed";
        if (!cancelled) setError(message);
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      markersRef.current = [];
      polylineRef.current = null;
    };
  }, [onReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (mapEpoch === 0 || !map || !L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = markers.map((m) =>
      L.circleMarker([m.position.lat, m.position.lng], {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: m.color === "green" ? "#2E7D32" : "#C62828",
        fillOpacity: 1,
      })
        .bindTooltip(m.title)
        .addTo(map),
    );

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (routePath.length >= 2) {
      polylineRef.current = L.polyline(
        routePath.map((p) => [p.lat, p.lng]),
        { color: VERDE_PRIMARIO, weight: 5, opacity: 1 },
      ).addTo(map);
    }

    const pts: LatLngLiteral[] = [
      ...routePath,
      ...markers.map((m) => m.position),
    ];
    if (pts.length === 0) {
      map.setView([CENTRO_MEDELLIN.lat, CENTRO_MEDELLIN.lng], 12);
    } else if (pts.length === 1) {
      map.setView([pts[0]!.lat, pts[0]!.lng], 14);
    } else {
      const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [72, 72] });
    }
    map.invalidateSize();
  }, [mapEpoch, markers, routePath]);

  if (error) {
    return (
      <div
        className={[
          "flex h-full min-h-[240px] items-center justify-center bg-[#F5F5F5]",
          className,
        ].join(" ")}
      >
        <EmptyState
          title="Mapa no disponible"
          description="No se pudo cargar OpenStreetMap. Revisa la conexión e intenta de nuevo."
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={["h-full min-h-[240px] w-full", className].join(" ")}
      role="application"
      aria-label="Mapa de rutas GoPoli"
    />
  );
}
