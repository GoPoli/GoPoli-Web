/**
 * Helpers de sesión para viajes (no reimplementan login).
 * Usan `@/features/auth/session`.
 */
import { getAccessToken, getSessionUser } from "@/features/auth/session";

export { getAccessToken };

export function getUserId(): number | null {
  const u = getSessionUser();
  return u?.idUsuario ?? null;
}

/** Equivalente a SessionManager.esConductor (idTipoUsuario === 2 / isDriver). */
export function isConductor(): boolean {
  const u = getSessionUser();
  if (!u) return false;
  return u.isDriver === true || u.idTipoUsuario === 2;
}
