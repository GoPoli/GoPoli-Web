/** Equivalente a Flutter `ApiException` / `FieldValidationException`. */

const VEHICLE_FIELDS = new Set(["marca", "modelo", "color", "placa"]);

export class ApiException extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
  }
}

export class FieldValidationException extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super("Errores de validación de campos");
    this.name = "FieldValidationException";
    this.fieldErrors = fieldErrors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldErrorMap(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((k) => VEHICLE_FIELDS.has(k));
}

function defaultMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Datos inválidos. Revisa el formulario.";
    case 401:
      return "Token inválido o ausente";
    case 403:
      return "Cuenta inhabilitada";
    case 409:
      return "Conflicto con los datos enviados.";
    default:
      return `Error del servidor (${statusCode}).`;
  }
}

/** Interpreta el cuerpo de error del backend (texto o JSON). */
export function throwFromResponse(statusCode: number, body: string): never {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    throw new ApiException(defaultMessage(statusCode), statusCode);
  }

  try {
    const decoded: unknown = JSON.parse(trimmed);
    if (isRecord(decoded)) {
      if (isFieldErrorMap(decoded)) {
        const fieldErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(decoded)) {
          fieldErrors[k] = String(v);
        }
        throw new FieldValidationException(fieldErrors);
      }
      if (decoded.message != null) {
        throw new ApiException(String(decoded.message), statusCode);
      }
    } else if (typeof decoded === "string") {
      throw new ApiException(decoded, statusCode);
    }
  } catch (err) {
    if (err instanceof FieldValidationException) throw err;
    if (err instanceof ApiException) throw err;
  }

  throw new ApiException(trimmed, statusCode);
}
