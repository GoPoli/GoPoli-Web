export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada. Copia .env.example a .env.");
  }
  return raw.replace(/\/+$/, "");
}
