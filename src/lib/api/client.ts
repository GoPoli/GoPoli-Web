import { getApiBaseUrl } from "@/config/env";
import { getAccessToken } from "@/features/auth/session";
import { ApiError, errorFromResponse } from "./errors";

export { ApiError, FieldValidationError } from "./errors";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  fallbackError?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const CONNECTION_ERROR = "No se pudo conectar con el servidor";
const SESSION_REQUIRED = "Inicia sesión para continuar";

function buildHeaders(hasBody: boolean, auth: boolean): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (hasBody) headers["Content-Type"] = "application/json";
  const token = auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseBody(text: string): unknown {
  if (!text.trim()) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fallbackError,
  } = options;

  if (auth && !getAccessToken()) {
    throw new ApiError(SESSION_REQUIRED, 401);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: buildHeaders(body !== undefined, auth),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw errorFromResponse(response.status, text, fallbackError);
    }
    return parseBody(text) as T;
  } catch (error) {
    if (error instanceof ApiError || signal?.aborted) throw error;
    throw new ApiError(CONNECTION_ERROR);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

export async function apiRequestOrNull<T = unknown>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
