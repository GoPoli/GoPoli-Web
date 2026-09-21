/**
 * Common HTTP headers (JSON + optional Bearer).
 * Mirrors frontend/lib/core/api_client.dart — token is passed in;
 * do not read/write localStorage here.
 */
export function jsonHeaders(options?: {
  token?: string | null;
  withAuth?: boolean;
}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const withAuth = options?.withAuth !== false;
  const token = options?.token?.trim();
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/** Explicit Authorization helper when building custom header sets. */
export function authorizationHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token.trim()}` };
}
