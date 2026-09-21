import type { Vehiculo } from "./vehiculo";

/** Mirrors UsuarioDto / frontend Usuario (no password). */
export interface Usuario {
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
}

/** Body for POST /register (Usuario.toRegisterJson). */
export interface RegisterRequest {
  correo: string;
  contrasena: string;
  nombre: string;
  tel?: string | null;
  idCarrera: number;
}

/** Body for PUT /usuario/me (Usuario.toUpdateJson). */
export interface UpdateUsuarioRequest {
  nombre: string;
  tel?: string | null;
  correo: string;
}
