import { getApiBaseUrl } from "@/config/env";
import { getAccessToken } from "@/features/servicios/session";
import type { GuardarRutaHabitualPayload, RutaHabitual } from "./types";

function apiBase(): string {
  return getApiBaseUrl();
}

async function readBodyText(res: Response): Promise<string> {
  try {
    return (await res.text()).trim();
  } catch {
    return "";
  }
}

function parseId(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeRuta(raw: Record<string, unknown>): RutaHabitual | null {
  const idRuta = parseId(raw.idRuta);
  const idUsuario = parseId(raw.idUsuario);
  const idLugarSalida = parseId(raw.idLugarSalida);
  const idLugarLlegada = parseId(raw.idLugarLlegada);
  const capacidad = parseId(raw.capacidad);
  const idTipoServicio = parseId(raw.idTipoServicio) ?? 1;
  if (
    idRuta == null ||
    idUsuario == null ||
    idLugarSalida == null ||
    idLugarLlegada == null ||
    capacidad == null
  ) {
    return null;
  }
  return {
    idRuta,
    idUsuario,
    idLugarSalida,
    idLugarLlegada,
    diasSemana: String(raw.diasSemana ?? ""),
    horaSalida: String(raw.horaSalida ?? ""),
    capacidad,
    idTipoServicio,
    descripcion: raw.descripcion == null ? null : String(raw.descripcion),
    nombreSalida: raw.nombreSalida == null ? null : String(raw.nombreSalida),
    nombreLlegada: raw.nombreLlegada == null ? null : String(raw.nombreLlegada),
  };
}

function jsonHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export class AgendaApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(body || `Error HTTP ${status}`);
    this.name = "AgendaApiError";
    this.status = status;
    this.body = body;
  }
}

/** GET /agenda/rutas/usuario/{idUsuario} */
export async function fetchRutasHabituales(
  idUsuario: number,
  signal?: AbortSignal,
): Promise<RutaHabitual[]> {
  const res = await fetch(`${apiBase()}/agenda/rutas/usuario/${idUsuario}`, {
    method: "GET",
    headers: getHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new AgendaApiError(
      res.status,
      (await readBodyText(res)) || "Error al listar rutas",
    );
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(normalizeRuta)
    .filter((r): r is RutaHabitual => r != null);
}

/** POST /agenda/rutas */
export async function crearRutaHabitual(
  payload: GuardarRutaHabitualPayload,
  signal?: AbortSignal,
): Promise<RutaHabitual> {
  const res = await fetch(`${apiBase()}/agenda/rutas`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new AgendaApiError(res.status, text || "Error al guardar la ruta");
  }
  const data = JSON.parse(text) as Record<string, unknown>;
  const r = normalizeRuta(data);
  if (!r) throw new AgendaApiError(200, "Respuesta de ruta inválida");
  return r;
}

/** PUT /agenda/rutas/{idRuta} */
export async function actualizarRutaHabitual(
  idRuta: number,
  payload: GuardarRutaHabitualPayload,
  signal?: AbortSignal,
): Promise<RutaHabitual> {
  const res = await fetch(`${apiBase()}/agenda/rutas/${idRuta}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new AgendaApiError(res.status, text || "Error al actualizar la ruta");
  }
  const data = JSON.parse(text) as Record<string, unknown>;
  const r = normalizeRuta(data);
  if (!r) throw new AgendaApiError(200, "Respuesta de ruta inválida");
  return r;
}

/** DELETE /agenda/rutas/{idRuta}?idUsuario= */
export async function eliminarRutaHabitual(
  idRuta: number,
  idUsuario: number,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(
    `${apiBase()}/agenda/rutas/${idRuta}?idUsuario=${idUsuario}`,
    { method: "DELETE", headers: getHeaders(), signal },
  );
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new AgendaApiError(res.status, text || "Error al eliminar");
  }
  return text || "Ruta eliminada";
}
