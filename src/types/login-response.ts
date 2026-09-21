import type { Usuario } from "./usuario";

/** Mirrors LoginResponse DTO / Dart LoginResponse. */
export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/** Body for POST /login. */
export interface LoginRequest {
  correo: string;
  contrasena: string;
}
