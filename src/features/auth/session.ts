/**
 * In-memory session store (JWT + usuario).
 *
 * SECURITY: Do NOT write the JWT to localStorage/sessionStorage.
 * Reload clears the session — see SECURITY.md.
 */

import type { Usuario } from "./types";

export type AuthSession = {
  token: string;
  usuario: Usuario;
};

type Listener = () => void;

let token: string | null = null;
let usuario: Usuario | null = null;
let snapshot: AuthSession | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getAccessToken(): string | null {
  return token;
}

export function getSessionUser(): Usuario | null {
  return usuario;
}

export function getSessionSnapshot(): AuthSession | null {
  if (!token || !usuario) {
    snapshot = null;
    return null;
  }
  if (!snapshot || snapshot.token !== token || snapshot.usuario !== usuario) {
    snapshot = { token, usuario };
  }
  return snapshot;
}

export function hasSession(): boolean {
  return Boolean(token && token.length > 0 && usuario?.idUsuario != null);
}

export function setSession(session: AuthSession): void {
  token = session.token;
  usuario = session.usuario;
  emit();
}

export function clearSession(): void {
  token = null;
  usuario = null;
  snapshot = null;
  emit();
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
