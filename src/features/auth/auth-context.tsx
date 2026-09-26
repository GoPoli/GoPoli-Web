"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { fetchPrograms } from "@/features/catalog/api";
import type { Program } from "@/features/catalog/types";
import * as authService from "./auth-service";
import {
  clearSession,
  getSessionSnapshot,
  hasSession,
  subscribeSession,
  type AuthSession,
} from "./session";
import type { LoginPayload, LoginResponse, RegisterPayload, User } from "./types";

export type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  fetchPrograms: () => Promise<Program[]>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getServerSnapshot(): AuthSession | null {
  return null;
}

function useSessionSnapshot(): AuthSession | null {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSnapshot);
}

function useLogout(): () => void {
  const router = useRouter();
  return useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);
}

function loadPrograms(): Promise<Program[]> {
  return fetchPrograms();
}

// La sesión vive en memoria: recargar la página obliga a iniciar sesión de nuevo (ver SECURITY.md).
export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSessionSnapshot();
  const logout = useLogout();

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      isAuthenticated: hasSession(),
      login: authService.login,
      register: authService.register,
      logout,
      fetchPrograms: loadPrograms,
    }),
    [session, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  const session = useSessionSnapshot();
  const logout = useLogout();

  if (context) return context;

  return {
    token: session?.token ?? null,
    user: session?.user ?? null,
    isAuthenticated: hasSession(),
    login: authService.login,
    register: authService.register,
    logout,
    fetchPrograms: loadPrograms,
  };
}
