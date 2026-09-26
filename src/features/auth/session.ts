import type { User } from "./types";

// El JWT vive solo en memoria: nunca se guarda en localStorage ni sessionStorage (ver SECURITY.md).

export type AuthSession = {
  token: string;
  user: User;
};

type Listener = () => void;

let token: string | null = null;
let user: User | null = null;
let snapshot: AuthSession | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function getAccessToken(): string | null {
  return token;
}

export function getSessionUser(): User | null {
  return user;
}

export function getSessionUserId(): number | null {
  return user?.id ?? null;
}

export function isSessionDriver(): boolean {
  return user?.isDriver === true;
}

export function getSessionSnapshot(): AuthSession | null {
  if (!token || !user) {
    snapshot = null;
    return null;
  }
  if (!snapshot || snapshot.token !== token || snapshot.user !== user) {
    snapshot = { token, user };
  }
  return snapshot;
}

export function hasSession(): boolean {
  return Boolean(token && user?.id != null);
}

export function setSession(session: AuthSession): void {
  token = session.token;
  user = session.user;
  emit();
}

export function updateSessionUser(next: User): void {
  if (!token) return;
  user = next;
  emit();
}

export function clearSession(): void {
  token = null;
  user = null;
  snapshot = null;
  emit();
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
