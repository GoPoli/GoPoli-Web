import { isRecord } from "@/lib/parse";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class FieldValidationError extends ApiError {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>, status: number) {
    super(Object.values(fieldErrors).join("\n"), status);
    this.name = "FieldValidationError";
    this.fieldErrors = fieldErrors;
  }
}

const FIELD_ERROR_KEYS = new Set(["brand", "model", "color", "plate"]);

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return "Datos inválidos. Revisa el formulario.";
    case 401:
      return "Tu sesión no es válida. Inicia sesión de nuevo.";
    case 403:
      return "No tienes permiso para esta acción.";
    case 404:
      return "No se encontró lo que buscabas.";
    case 409:
      return "Conflicto con los datos enviados.";
    default:
      return `Error del servidor (${status}).`;
  }
}

export function errorFromResponse(status: number, body: string, fallback?: string): ApiError {
  const text = body.trim();
  if (!text) {
    return new ApiError(fallback ?? defaultMessage(status), status);
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    return new ApiError(text, status);
  }
  if (typeof decoded === "string") {
    return new ApiError(decoded, status);
  }
  if (isRecord(decoded)) {
    if (Object.keys(decoded).some((key) => FIELD_ERROR_KEYS.has(key))) {
      const fieldErrors = Object.fromEntries(
        Object.entries(decoded).map(([key, value]) => [key, String(value)]),
      );
      return new FieldValidationError(fieldErrors, status);
    }
    if (decoded.message != null) {
      return new ApiError(String(decoded.message), status);
    }
  }
  return new ApiError(fallback ?? defaultMessage(status), status);
}
