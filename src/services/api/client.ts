import { getApiBaseUrl } from "@/config/env";
import { ApiException } from "@/lib/api/exceptions";
import { jsonHeaders } from "@/lib/api/headers";

export { ApiException, FieldValidationException } from "@/lib/api/exceptions";
export { authorizationHeader, jsonHeaders } from "@/lib/api/headers";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  method?: HttpMethod;
  /** Relative path, e.g. "/login" or "login". */
  path: string;
  body?: unknown;
  /**
   * JWT for Authorization: Bearer … when provided.
   * Caller owns token storage — this client never persists tokens.
   */
  token?: string | null;
  /** When false, never attach Authorization (e.g. login/register). Default true. */
  withAuth?: boolean;
  signal?: AbortSignal;
  /** Fetch timeout in ms. Default 15000 (Flutter services use 15s). */
  timeoutMs?: number;
}

function joinUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Typed fetch client against NEXT_PUBLIC_API_URL.
 * Parses errors like the Flutter ApiException.fromResponse flow.
 */
export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const {
    method = "GET",
    path,
    body,
    token,
    withAuth = true,
    signal,
    timeoutMs = 15_000,
  } = options;

  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(joinUrl(baseUrl, path), {
      method,
      headers: jsonHeaders({ token, withAuth }),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      throw ApiException.fromResponse(response.status, text);
    }

    if (!text.trim()) {
      // void successful responses
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      // Spring sometimes returns a plain string body on success
      return text as T;
    }
  } catch (e) {
    if (e instanceof ApiException) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiException(`No se pudo conectar con el servidor (${baseUrl})`);
    }
    throw new ApiException(`No se pudo conectar con el servidor (${baseUrl})`);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function apiGet<T>(
  path: string,
  opts?: Omit<ApiRequestOptions, "path" | "method" | "body">,
): Promise<T> {
  return apiRequest<T>({ ...opts, path, method: "GET" });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: Omit<ApiRequestOptions, "path" | "method" | "body">,
): Promise<T> {
  return apiRequest<T>({ ...opts, path, method: "POST", body });
}

export function apiPut<T>(
  path: string,
  body?: unknown,
  opts?: Omit<ApiRequestOptions, "path" | "method" | "body">,
): Promise<T> {
  return apiRequest<T>({ ...opts, path, method: "PUT", body });
}

export function apiDelete<T>(
  path: string,
  opts?: Omit<ApiRequestOptions, "path" | "method" | "body">,
): Promise<T> {
  return apiRequest<T>({ ...opts, path, method: "DELETE" });
}
