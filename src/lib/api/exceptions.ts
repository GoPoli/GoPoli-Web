/**
 * Field-level validation errors from the backend (vehicle fields map).
 * Mirrors frontend/lib/core/field_validation_exception.dart.
 */
export class FieldValidationException extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>) {
    super(Object.values(fieldErrors).join("\n"));
    this.name = "FieldValidationException";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * API / network error. Mirrors frontend/lib/core/api_exception.dart.
 */
export class ApiException extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
  }

  static fromResponse(statusCode: number, body: string): ApiException {
    let msg = body.trim();
    if (!msg) {
      return new ApiException(defaultMessage(statusCode), statusCode);
    }

    try {
      const decoded: unknown = JSON.parse(msg);
      if (decoded !== null && typeof decoded === "object" && !Array.isArray(decoded)) {
        const map = decoded as Record<string, unknown>;
        if (map.message != null) {
          msg = String(map.message);
        } else if (isFieldErrorMap(map)) {
          const fieldErrors: Record<string, string> = {};
          for (const [k, v] of Object.entries(map)) {
            fieldErrors[k] = String(v);
          }
          throw new FieldValidationException(fieldErrors);
        }
      } else if (typeof decoded === "string") {
        msg = decoded;
      }
    } catch (e) {
      if (e instanceof FieldValidationException) throw e;
      // Plain-text Spring body — keep msg as trimmed body.
    }

    return new ApiException(msg, statusCode);
  }
}

function defaultMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Datos inválidos. Revisa el formulario.";
    case 409:
      return "El correo ya está registrado.";
    case 401:
      return "Credenciales incorrectas.";
    default:
      return `Error del servidor (${statusCode}).`;
  }
}

const VEHICLE_FIELD_KEYS = new Set(["marca", "modelo", "color", "placa"]);

function isFieldErrorMap(decoded: Record<string, unknown>): boolean {
  return Object.keys(decoded).some((k) => VEHICLE_FIELD_KEYS.has(k));
}
