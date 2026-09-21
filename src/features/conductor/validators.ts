/** Port of `frontend/lib/utils/vehicle_validators.dart`. */

const MARCA_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const MODELO_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]+$/;
const COLOR_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const PLACA_RE = /^[A-Z0-9]+$/;

export function validarMarca(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "La marca es obligatoria";
  if (v.length < 2) return "Mínimo 2 caracteres";
  if (!MARCA_RE.test(v)) return "Solo letras y espacios";
  return null;
}

export function validarModelo(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "El modelo es obligatorio";
  if (v.length < 2) return "Mínimo 2 caracteres";
  if (!MODELO_RE.test(v)) return "Solo letras, números y espacios";
  return null;
}

export function validarColor(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "El color es obligatorio";
  if (v.length < 3) return "Mínimo 3 caracteres";
  if (!COLOR_RE.test(v)) return "Solo letras y espacios";
  return null;
}

export function validarPlaca(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (v.length === 0) return "La placa es obligatoria";
  if (v.length < 5 || v.length > 8) {
    return "Entre 5 y 8 caracteres alfanuméricos";
  }
  if (!PLACA_RE.test(v)) return "Solo letras y números";
  return null;
}

export type ConductorFieldErrors = Partial<
  Record<"marca" | "modelo" | "color" | "placa", string>
>;

export function validarVehiculo(fields: {
  marca: string;
  modelo: string;
  color: string;
  placa: string;
}): ConductorFieldErrors {
  const errors: ConductorFieldErrors = {};
  const marca = validarMarca(fields.marca);
  const modelo = validarModelo(fields.modelo);
  const color = validarColor(fields.color);
  const placa = validarPlaca(fields.placa);
  if (marca) errors.marca = marca;
  if (modelo) errors.modelo = modelo;
  if (color) errors.color = color;
  if (placa) errors.placa = placa;
  return errors;
}
