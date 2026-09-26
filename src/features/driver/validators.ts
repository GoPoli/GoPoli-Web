const BRAND_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const MODEL_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]+$/;
const COLOR_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const PLATE_RE = /^[A-Z0-9]+$/;

export type VehicleField = "brand" | "model" | "color" | "plate";

export type VehicleFieldErrors = Partial<Record<VehicleField, string>>;

export function validateBrand(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "La marca es obligatoria";
  if (v.length < 2) return "Mínimo 2 caracteres";
  if (!BRAND_RE.test(v)) return "Solo letras y espacios";
  return null;
}

export function validateModel(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "El modelo es obligatorio";
  if (v.length < 2) return "Mínimo 2 caracteres";
  if (!MODEL_RE.test(v)) return "Solo letras, números y espacios";
  return null;
}

export function validateColor(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "El color es obligatorio";
  if (v.length < 3) return "Mínimo 3 caracteres";
  if (!COLOR_RE.test(v)) return "Solo letras y espacios";
  return null;
}

export function validatePlate(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (v.length === 0) return "La placa es obligatoria";
  if (v.length < 5 || v.length > 8) return "Entre 5 y 8 caracteres alfanuméricos";
  if (!PLATE_RE.test(v)) return "Solo letras y números";
  return null;
}

export function validateVehicle(fields: Record<VehicleField, string>): VehicleFieldErrors {
  const errors: VehicleFieldErrors = {};
  const brand = validateBrand(fields.brand);
  const model = validateModel(fields.model);
  const color = validateColor(fields.color);
  const plate = validatePlate(fields.plate);
  if (brand) errors.brand = brand;
  if (model) errors.model = model;
  if (color) errors.color = color;
  if (plate) errors.plate = plate;
  return errors;
}
