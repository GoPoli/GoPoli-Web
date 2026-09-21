/**
 * Public env accessors for the GoPoli PWA.
 * Only NEXT_PUBLIC_* values are available in the browser.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Backend REST base URL. Set via NEXT_PUBLIC_API_URL (see web/.env.example). */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Copy web/.env.example to web/.env.local.",
    );
  }
  return trimTrailingSlash(raw);
}

export const env = {
  get apiUrl() {
    return getApiBaseUrl();
  },
} as const;
