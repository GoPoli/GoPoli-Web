import { getApiBaseUrl } from "@/config/env";
import type { Ubicacion } from "./types";

function apiBase(): string {
  return getApiBaseUrl();
}

function parseId(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseCoord(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeUbicacion(raw: Record<string, unknown>): Ubicacion | null {
  const id = parseId(raw.idUbicacion);
  if (id == null) return null;
  return {
    idUbicacion: id,
    nombreUbicacion: String(raw.nombreUbicacion ?? ""),
    latitud: parseCoord(raw.latitud),
    longitud: parseCoord(raw.longitud),
  };
}

/** GET /ubicaciones */
export async function fetchUbicaciones(
  signal?: AbortSignal,
): Promise<Ubicacion[]> {
  const res = await fetch(`${apiBase()}/ubicaciones`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(
      res.statusText || `Error al cargar ubicaciones (${res.status})`,
    );
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(normalizeUbicacion)
    .filter((u): u is Ubicacion => u != null);
}

export function latLngForUbicacion(
  u: Ubicacion,
): { lat: number; lng: number } | null {
  if (u.latitud == null || u.longitud == null) return null;
  return { lat: u.latitud, lng: u.longitud };
}

export function findUbicacionById(
  list: Ubicacion[],
  id: number | null | undefined,
): Ubicacion | null {
  if (id == null) return null;
  return list.find((u) => u.idUbicacion === id) ?? null;
}
