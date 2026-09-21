/**
 * Auth-scoped HTTP helper on top of the shared API client.
 * Token: in-memory only (see SECURITY.md). Never persist JWT in localStorage.
 */

import {
  apiRequest,
  ApiException,
  type ApiRequestOptions,
} from "@/services/api/client";
import { getApiBaseUrl as getSharedApiBaseUrl } from "@/config/env";
import { getAccessToken } from "./session";

export { ApiException };

export function getApiBaseUrl(): string {
  try {
    return getSharedApiBaseUrl();
  } catch {
    return (process.env.NEXT_PUBLIC_API_URL?.trim() ?? "").replace(/\/$/, "");
  }
}

export type AuthHttpOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** When true, attach `Authorization: Bearer` from in-memory session. */
  withAuth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function authRequest<T>(
  path: string,
  options: AuthHttpOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiException(
      "NEXT_PUBLIC_API_URL no está configurada. Define la URL del backend.",
    );
  }

  const {
    method = "GET",
    body,
    withAuth = false,
    signal,
    timeoutMs,
  } = options;

  const request: ApiRequestOptions = {
    path,
    method,
    body,
    withAuth,
    token: withAuth ? getAccessToken() : null,
    signal,
    timeoutMs,
  };

  return apiRequest<T>(request);
}
