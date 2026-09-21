/** Mirrors Flutter `Usuario` / backend `UsuarioDto` (auth payloads). */
export type Usuario = {
  idUsuario: number;
  correo: string;
  nombre: string;
  tel?: string | null;
  idCarrera?: number | null;
  idTipoUsuario?: number | null;
  idEstado?: number | null;
  nota?: number | null;
  fotoPerfil?: string | null;
  isDriver: boolean;
};

/** Mirrors Flutter `LoginResponse`. */
export type LoginResponse = {
  token: string;
  usuario: Usuario;
};

/** Mirrors Flutter `Carrera` (registro dropdown). */
export type Carrera = {
  idCarrera: number;
  nombreCarrera: string;
};

export type RegisterPayload = {
  correo: string;
  contrasena: string;
  nombre: string;
  tel: string;
  idCarrera: number;
};

export type LoginPayload = {
  correo: string;
  contrasena: string;
};

function toInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = toInt(value);
  return Number.isFinite(n) ? n : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseUsuario(json: unknown): Usuario {
  if (!isRecord(json)) {
    throw new Error("Respuesta de usuario inválida");
  }
  const idTipo = toOptionalInt(json.idTipoUsuario);
  const isDriverJson = json.isDriver === true || json.driver === true;
  return {
    idUsuario: toInt(json.idUsuario),
    correo: json.correo?.toString() ?? "",
    nombre: json.nombre?.toString() ?? "",
    tel: json.tel != null ? String(json.tel) : null,
    idCarrera: toOptionalInt(json.idCarrera),
    idTipoUsuario: idTipo,
    idEstado: toOptionalInt(json.idEstado),
    nota:
      json.nota != null && typeof json.nota === "number"
        ? json.nota
        : json.nota != null
          ? Number(json.nota)
          : null,
    fotoPerfil: json.fotoPerfil != null ? String(json.fotoPerfil) : null,
    isDriver: isDriverJson || idTipo === 2,
  };
}

export function parseLoginResponse(json: unknown): LoginResponse {
  if (!isRecord(json) || !isRecord(json.usuario)) {
    throw new Error("Respuesta de login inválida");
  }
  return {
    token: json.token?.toString() ?? "",
    usuario: parseUsuario(json.usuario),
  };
}

export function parseCarrera(json: unknown): Carrera {
  if (!isRecord(json)) {
    throw new Error("Carrera inválida");
  }
  return {
    idCarrera: toInt(json.idCarrera),
    nombreCarrera: json.nombreCarrera?.toString() ?? "",
  };
}
