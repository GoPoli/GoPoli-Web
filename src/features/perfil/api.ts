/**
 * Cliente de perfil — mismos endpoints que Flutter `UsuarioService`.
 * Usa `getAccessToken` de la sesión en memoria (sin reimplementar login).
 */

import {
  getAccessToken,
  getSessionSnapshot,
  setSession,
  clearSession,
} from "@/features/auth/session";
import type { Usuario } from "@/features/auth/types";
import {
  ApiException,
  FieldValidationException,
  throwFromResponse,
} from "./errors";
import {
  parseHistorialViaje,
  parseUsuarioPerfil,
  type HistorialViaje,
  type UsuarioPerfil,
} from "./types";
import { buildProfilePayload } from "./payload";

const DEFAULT_TIMEOUT_MS = 15_000;

function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  return base.replace(/\/$/, "");
}

function toSessionUsuario(u: UsuarioPerfil): Usuario {
  return {
    idUsuario: u.idUsuario,
    correo: u.correo,
    nombre: u.nombre,
    tel: u.tel,
    idCarrera: u.idCarrera,
    idTipoUsuario: u.idTipoUsuario,
    idEstado: u.idEstado,
    nota: u.nota,
    fotoPerfil: u.fotoPerfil,
    isDriver: u.isDriver,
  };
}

function syncSessionUsuario(u: UsuarioPerfil): void {
  const snap = getSessionSnapshot();
  const token = snap?.token ?? getAccessToken();
  if (!token) return;
  setSession({ token, usuario: toSessionUsuario(u) });
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
};

async function usuarioRequest(
  path: string,
  options: RequestOptions = {},
): Promise<string> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiException(
      "NEXT_PUBLIC_API_URL no está configurada. Define la URL del backend.",
    );
  }

  const {
    method = "GET",
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(
      `${base}${path.startsWith("/") ? path : `/${path}`}`,
      {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      },
    );
    const text = await response.text();
    if (!response.ok) {
      throwFromResponse(response.status, text);
    }
    return text;
  } catch (err) {
    if (err instanceof FieldValidationException) throw err;
    if (err instanceof ApiException) throw err;
    if (
      err instanceof Error &&
      (err.name === "AbortError" ||
        (typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError"))
    ) {
      throw new ApiException("Error de conexión con el servidor");
    }
    throw new ApiException("Error de conexión con el servidor");
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

function parseJsonBody(text: string): unknown {
  if (text.trim().length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** GET /usuario/me */
export async function obtenerPerfil(
  signal?: AbortSignal,
): Promise<UsuarioPerfil> {
  const text = await usuarioRequest("/usuario/me", { signal });
  const u = parseUsuarioPerfil(parseJsonBody(text));
  syncSessionUsuario(u);
  return u;
}

/** PUT /usuario/me */
export async function actualizarPerfil(input: {
  nombre: string;
  tel: string;
  correo: string;
  idCarrera: number;
}): Promise<UsuarioPerfil> {
  const text = await usuarioRequest("/usuario/me", {
    method: "PUT",
    body: buildProfilePayload(input),
  });
  const u = parseUsuarioPerfil(parseJsonBody(text));
  syncSessionUsuario(u);
  return u;
}

/** PUT /usuario/me/foto — body `{ fotoBase64 }` */
export async function subirFotoPerfil(
  fotoBase64: string,
): Promise<UsuarioPerfil> {
  const text = await usuarioRequest("/usuario/me/foto", {
    method: "PUT",
    body: { fotoBase64 },
  });
  const u = parseUsuarioPerfil(parseJsonBody(text));
  syncSessionUsuario(u);
  return u;
}

/** POST /usuario/me/register-driver */
export async function registerAsDriver(input: {
  marca: string;
  modelo: string;
  color: string;
  placa: string;
}): Promise<UsuarioPerfil> {
  const text = await usuarioRequest("/usuario/me/register-driver", {
    method: "POST",
    body: {
      marca: input.marca.trim(),
      modelo: input.modelo.trim(),
      color: input.color.trim(),
      placa: input.placa.trim().toUpperCase(),
    },
  });
  const u = parseUsuarioPerfil(parseJsonBody(text));
  syncSessionUsuario(u);
  return u;
}

/** POST /usuario/me/unregister-driver */
export async function unregisterAsDriver(): Promise<UsuarioPerfil> {
  const text = await usuarioRequest("/usuario/me/unregister-driver", {
    method: "POST",
  });
  const u = parseUsuarioPerfil(parseJsonBody(text));
  syncSessionUsuario(u);
  return u;
}

/** GET /usuario/me/historial-viajes (máx. 10 finalizados) */
export async function obtenerHistorialViajes(
  signal?: AbortSignal,
): Promise<HistorialViaje[]> {
  const text = await usuarioRequest("/usuario/me/historial-viajes", {
    signal,
  });
  const data = parseJsonBody(text);
  if (!Array.isArray(data)) return [];
  return data.map(parseHistorialViaje);
}

/** POST /usuario/me/inhabilitar — cierra sesión local al éxito */
export async function inhabilitarCuenta(): Promise<void> {
  await usuarioRequest("/usuario/me/inhabilitar", { method: "POST" });
  clearSession();
}

/** DELETE /usuario/me — cierra sesión local al éxito */
export async function eliminarCuenta(): Promise<void> {
  await usuarioRequest("/usuario/me", { method: "DELETE" });
  clearSession();
}
