"use client";

/**
 * Auth context: JWT kept in memory only (React state + session module).
 * Full page reload clears the session — see SECURITY.md.
 * Backend only supports Authorization: Bearer; no httpOnly cookie without backend change.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import * as authService from "./auth-service";
import {
  clearSession,
  getSessionSnapshot,
  hasSession,
  subscribeSession,
  type AuthSession,
} from "./session";
import type {
  Carrera,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  Usuario,
} from "./types";

export type AuthContextValue = {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  register: (payload: RegisterPayload) => Promise<Usuario>;
  logout: () => void;
  fetchCarreras: () => Promise<Carrera[]>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getClientSnapshot(): AuthSession | null {
  return getSessionSnapshot();
}

function getServerSnapshot(): AuthSession | null {
  return null;
}

function useSessionSnapshot(): AuthSession | null {
  return useSyncExternalStore(
    subscribeSession,
    getClientSnapshot,
    getServerSnapshot,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSessionSnapshot();

  const login = useCallback(async (payload: LoginPayload) => {
    return authService.login(payload);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    return authService.register(payload);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  const fetchCarreras = useCallback(() => authService.fetchCarreras(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      usuario: session?.usuario ?? null,
      isAuthenticated: hasSession(),
      login,
      register,
      logout,
      fetchCarreras,
    }),
    [session, login, register, logout, fetchCarreras],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

/**
 * Reads the in-memory session. Works inside AuthProvider or standalone
 * (token lives in the session module, so SPA navigations keep it).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  const router = useRouter();
  const session = useSessionSnapshot();

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  if (ctx) return ctx;

  return {
    token: session?.token ?? null,
    usuario: session?.usuario ?? null,
    isAuthenticated: hasSession(),
    login: authService.login,
    register: authService.register,
    logout,
    fetchCarreras: authService.fetchCarreras,
  };
}

/** Logout helper usable outside React trees that already imported a navigate fn. */
export function logoutAndRedirect(navigate: (path: string) => void): void {
  clearSession();
  navigate("/login");
}
