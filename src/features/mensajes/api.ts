import { getApiBaseUrl } from "@/config/env";
import { getAccessToken } from "@/features/servicios/session";
import type { Mensaje } from "./types";

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

function normalizeMensaje(raw: Record<string, unknown>): Mensaje | null {
  const idMensaje = parseId(raw.idMensaje);
  const idServicio = parseId(raw.idServicio);
  const idUsuario = parseId(raw.idUsuario);
  if (idMensaje == null || idServicio == null || idUsuario == null) return null;
  return {
    idMensaje,
    idServicio,
    idUsuario,
    texto: String(raw.texto ?? ""),
    fechaEnvio: String(raw.fechaEnvio ?? ""),
    nombreUsuario:
      raw.nombreUsuario == null ? null : String(raw.nombreUsuario),
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

export class MensajeApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(body || `Error HTTP ${status}`);
    this.name = "MensajeApiError";
    this.status = status;
    this.body = body;
  }
}

/** GET /servicio/{id}/mensajes?idUsuario= */
export async function fetchMensajes(
  idServicio: number,
  idUsuario: number,
  signal?: AbortSignal,
): Promise<Mensaje[]> {
  const url = `${apiBase()}/servicio/${idServicio}/mensajes?idUsuario=${idUsuario}`;
  const res = await fetch(url, { method: "GET", headers: getHeaders(), signal });
  if (!res.ok) {
    throw new MensajeApiError(
      res.status,
      (await readBodyText(res)) || "Error al listar mensajes",
    );
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(normalizeMensaje)
    .filter((m): m is Mensaje => m != null);
}

/** POST /servicio/{id}/mensajes */
export async function enviarMensaje(
  idServicio: number,
  idUsuario: number,
  texto: string,
  signal?: AbortSignal,
): Promise<Mensaje> {
  const res = await fetch(`${apiBase()}/servicio/${idServicio}/mensajes`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ idUsuario, texto }),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new MensajeApiError(res.status, text || "Error al enviar mensaje");
  }
  const data = JSON.parse(text) as Record<string, unknown>;
  const m = normalizeMensaje(data);
  if (!m) throw new MensajeApiError(200, "Respuesta de mensaje inválida");
  return m;
}
