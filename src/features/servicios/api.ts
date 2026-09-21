import { getApiBaseUrl } from "@/config/env";
import type {
  CrearServicioPayload,
  MiembroGrupo,
  ServicioEnriquecido,
  UnirsePayload,
} from "./types";
/** Bearer opcional; Flutter no exige JWT en /servicio/*. */
import { getAccessToken } from "./session";

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

function normalizeServicio(
  raw: Record<string, unknown>,
): ServicioEnriquecido | null {
  const idServicio = parseId(raw.idServicio);
  const idLugarSalida = parseId(raw.idLugarSalida);
  const idLugarLlegada = parseId(raw.idLugarLlegada);
  const idCreador = parseId(raw.idCreador);
  const idTipoServicio = parseId(raw.idTipoServicio);
  const idEstadoServicio = parseId(raw.idEstadoServicio);
  const capacidad = parseId(raw.capacidad);
  if (
    idServicio == null ||
    idLugarSalida == null ||
    idLugarLlegada == null ||
    idCreador == null ||
    idTipoServicio == null ||
    idEstadoServicio == null ||
    capacidad == null
  ) {
    return null;
  }
  return {
    idServicio,
    fecha: String(raw.fecha ?? ""),
    descripcion:
      raw.descripcion == null ? null : String(raw.descripcion),
    idLugarSalida,
    idLugarLlegada,
    horaSalida: String(raw.horaSalida ?? ""),
    idCreador,
    idTipoServicio,
    idEstadoServicio,
    capacidad,
    tripType: String(raw.tripType ?? "passenger_group"),
    tripTypeLabel: String(raw.tripTypeLabel ?? "Grupo de viaje"),
  };
}

function normalizeMiembro(raw: Record<string, unknown>): MiembroGrupo | null {
  const idUsuario = parseId(raw.idUsuario);
  if (idUsuario == null) return null;
  return {
    idUsuario,
    rol: String(raw.rol ?? ""),
    rolParticipacion:
      raw.rolParticipacion == null ? null : String(raw.rolParticipacion),
    rolParticipacionLabel:
      raw.rolParticipacionLabel == null
        ? null
        : String(raw.rolParticipacionLabel),
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
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export class ServicioApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(body || `Error HTTP ${status}`);
    this.name = "ServicioApiError";
    this.status = status;
    this.body = body;
  }
}

/** POST /servicio/crear */
export async function crearServicio(
  payload: CrearServicioPayload,
  signal?: AbortSignal,
): Promise<ServicioEnriquecido> {
  const res = await fetch(`${apiBase()}/servicio/crear`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new ServicioApiError(res.status, text || "Error al crear el servicio");
  }
  const data = JSON.parse(text) as Record<string, unknown>;
  const s = normalizeServicio(data);
  if (!s) throw new ServicioApiError(200, "Respuesta de servicio inválida");
  return s;
}

/** GET /servicios/activos */
export async function fetchServiciosActivos(
  signal?: AbortSignal,
): Promise<ServicioEnriquecido[]> {
  const res = await fetch(`${apiBase()}/servicios/activos`, {
    method: "GET",
    headers: getHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new ServicioApiError(
      res.status,
      (await readBodyText(res)) || "Error al listar servicios",
    );
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(normalizeServicio)
    .filter((s): s is ServicioEnriquecido => s != null);
}

/** POST /servicio/unirse */
export async function unirseServicio(
  payload: UnirsePayload,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${apiBase()}/servicio/unirse`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new ServicioApiError(res.status, text || "Error al unirse");
  }
  return text || "Te uniste al grupo exitosamente";
}

/** GET /servicio/{id} */
export async function fetchServicio(
  idServicio: number,
  signal?: AbortSignal,
): Promise<ServicioEnriquecido | null> {
  const res = await fetch(`${apiBase()}/servicio/${idServicio}`, {
    method: "GET",
    headers: getHeaders(),
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ServicioApiError(
      res.status,
      (await readBodyText(res)) || "Error al cargar servicio",
    );
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeServicio(data);
}

/** GET /servicio/{id}/miembros */
export async function fetchMiembros(
  idServicio: number,
  signal?: AbortSignal,
): Promise<MiembroGrupo[]> {
  const res = await fetch(`${apiBase()}/servicio/${idServicio}/miembros`, {
    method: "GET",
    headers: getHeaders(),
    signal,
  });
  if (!res.ok) {
    throw new ServicioApiError(
      res.status,
      (await readBodyText(res)) || "Error al traer miembros",
    );
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object"),
    )
    .map(normalizeMiembro)
    .filter((m): m is MiembroGrupo => m != null);
}

/** PUT /servicio/cancelar/{id} */
export async function cancelarServicio(
  idServicio: number,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${apiBase()}/servicio/cancelar/${idServicio}`, {
    method: "PUT",
    headers: getHeaders(),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new ServicioApiError(res.status, text || "Error al cancelar");
  }
  return text || "Servicio cancelado";
}

/** PUT /servicio/iniciar/{id} */
export async function iniciarServicio(
  idServicio: number,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${apiBase()}/servicio/iniciar/${idServicio}`, {
    method: "PUT",
    headers: getHeaders(),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new ServicioApiError(res.status, text || "Error al iniciar");
  }
  return text || "Viaje iniciado";
}

/** PUT /servicio/finalizar/{id} */
export async function finalizarServicio(
  idServicio: number,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${apiBase()}/servicio/finalizar/${idServicio}`, {
    method: "PUT",
    headers: getHeaders(),
    signal,
  });
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new ServicioApiError(res.status, text || "Error al finalizar");
  }
  return text || "Viaje finalizado";
}

/** DELETE /servicio/salir/{idServicio}/{idUsuario} */
export async function salirServicio(
  idServicio: number,
  idUsuario: number,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(
    `${apiBase()}/servicio/salir/${idServicio}/${idUsuario}`,
    {
      method: "DELETE",
      headers: getHeaders(),
      signal,
    },
  );
  const text = await readBodyText(res);
  if (!res.ok) {
    throw new ServicioApiError(res.status, text || "Error al salir");
  }
  return text || "Saliste del grupo";
}

/**
 * GET /servicio/usuario/activo/{id} — 404 = sin servicio activo como creador.
 */
export async function fetchServicioActivoCreador(
  idUsuario: number,
  signal?: AbortSignal,
): Promise<ServicioEnriquecido | null> {
  const res = await fetch(
    `${apiBase()}/servicio/usuario/activo/${idUsuario}`,
    { method: "GET", headers: getHeaders(), signal },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ServicioApiError(
      res.status,
      (await readBodyText(res)) || "Error",
    );
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeServicio(data);
}

/**
 * GET /servicio/usuario/miembro/{id} — 404 = sin grupo activo como miembro.
 */
export async function fetchServicioActivoMiembro(
  idUsuario: number,
  signal?: AbortSignal,
): Promise<ServicioEnriquecido | null> {
  const res = await fetch(
    `${apiBase()}/servicio/usuario/miembro/${idUsuario}`,
    { method: "GET", headers: getHeaders(), signal },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ServicioApiError(
      res.status,
      (await readBodyText(res)) || "Error",
    );
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeServicio(data);
}

/**
 * GET /servicio/usuario/encurso/{id} — 404 = sin viaje en curso.
 */
export async function fetchServicioEnCurso(
  idUsuario: number,
  signal?: AbortSignal,
): Promise<ServicioEnriquecido | null> {
  const res = await fetch(
    `${apiBase()}/servicio/usuario/encurso/${idUsuario}`,
    { method: "GET", headers: getHeaders(), signal },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new ServicioApiError(
      res.status,
      (await readBodyText(res)) || "Error",
    );
  }
  const data = (await res.json()) as Record<string, unknown>;
  return normalizeServicio(data);
}

/** Como Flutter: activo como creador, si no como miembro. */
export async function fetchIdServicioActivoUsuario(
  idUsuario: number,
  signal?: AbortSignal,
): Promise<number | null> {
  const comoCreador = await fetchServicioActivoCreador(idUsuario, signal);
  if (comoCreador) return comoCreador.idServicio;
  const comoMiembro = await fetchServicioActivoMiembro(idUsuario, signal);
  return comoMiembro?.idServicio ?? null;
}
