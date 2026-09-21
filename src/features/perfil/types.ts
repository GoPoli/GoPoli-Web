/** Tipos de perfil / vehículo / historial (espejo Flutter + UsuarioDto). */

export type Vehiculo = {
  idVehiculo?: number | null;
  marca: string;
  modelo: string;
  color: string;
  placa: string;
};

export type UsuarioPerfil = {
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
  vehiculo?: Vehiculo | null;
};

export type ParticipanteHistorial = {
  nombreUsuario: string;
  rolParticipacionLabel: string;
};

export type HistorialViaje = {
  idServicio: number;
  fecha?: string | null;
  horaSalida?: string | null;
  descripcion?: string | null;
  tripType?: string | null;
  tripTypeLabel?: string | null;
  nombreSalida?: string | null;
  nombreLlegada?: string | null;
  miRolParticipacionLabel?: string | null;
  participantes: ParticipanteHistorial[];
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

export function parseVehiculo(json: unknown): Vehiculo | null {
  if (!isRecord(json)) return null;
  return {
    idVehiculo: json.idVehiculo != null ? toOptionalInt(json.idVehiculo) : null,
    marca: json.marca?.toString() ?? "",
    modelo: json.modelo?.toString() ?? "",
    color: json.color?.toString() ?? "",
    placa: json.placa?.toString() ?? "",
  };
}

export function parseUsuarioPerfil(json: unknown): UsuarioPerfil {
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
    vehiculo: parseVehiculo(json.vehiculo),
  };
}

export function parseParticipanteHistorial(
  json: unknown,
): ParticipanteHistorial {
  if (!isRecord(json)) {
    return { nombreUsuario: "Usuario", rolParticipacionLabel: "Pasajero" };
  }
  return {
    nombreUsuario: json.nombreUsuario?.toString() ?? "Usuario",
    rolParticipacionLabel:
      json.rolParticipacionLabel?.toString() ?? "Pasajero",
  };
}

export function parseHistorialViaje(json: unknown): HistorialViaje {
  if (!isRecord(json)) {
    throw new Error("Respuesta de historial inválida");
  }
  const parts = json.participantes;
  return {
    idServicio: toInt(json.idServicio),
    fecha: json.fecha != null ? String(json.fecha) : null,
    horaSalida: json.horaSalida != null ? String(json.horaSalida) : null,
    descripcion: json.descripcion != null ? String(json.descripcion) : null,
    tripType: json.tripType != null ? String(json.tripType) : null,
    tripTypeLabel:
      json.tripTypeLabel != null ? String(json.tripTypeLabel) : null,
    nombreSalida:
      json.nombreSalida != null ? String(json.nombreSalida) : null,
    nombreLlegada:
      json.nombreLlegada != null ? String(json.nombreLlegada) : null,
    miRolParticipacionLabel:
      json.miRolParticipacionLabel != null
        ? String(json.miRolParticipacionLabel)
        : null,
    participantes: Array.isArray(parts)
      ? parts.map(parseParticipanteHistorial)
      : [],
  };
}

export function etiquetaTipoUsuario(usuario: UsuarioPerfil): string {
  return usuario.isDriver || usuario.idTipoUsuario === 2
    ? "Conductor"
    : "Pasajero";
}
