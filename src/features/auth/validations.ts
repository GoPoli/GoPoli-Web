const BASIC_EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{3,120}$/;
const PASSWORD_MAX_BYTES = 72;
const PHONE_RE = /^[0-9]{8,14}$/;

export const INSTITUTIONAL_DOMAIN = "@elpoli.edu.co";

export function emailError(email: string): string | null {
  const value = email.trim();
  if (value.length === 0) return "El correo es obligatorio";
  if (!BASIC_EMAIL_RE.test(value)) return "Ingresa un correo válido";
  if (!value.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN)) {
    return `Usa tu correo ${INSTITUTIONAL_DOMAIN}`;
  }
  return null;
}

export function passwordError(password: string): string | null {
  if (password.length === 0) return "La contraseña es obligatoria";
  if (password.length < 8) return "Mínimo 8 caracteres";
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return "Máximo 72 caracteres";
  return null;
}

export function confirmationError(password: string, confirmation: string): string | null {
  if (confirmation.length === 0) return "Confirma tu contraseña";
  if (password !== confirmation) return "Las contraseñas no coinciden";
  return null;
}

export function nameError(name: string): string | null {
  const value = name.trim();
  if (value.length === 0) return "El nombre es obligatorio";
  if (!NAME_RE.test(value)) return "Solo letras y espacios (entre 3 y 120 caracteres)";
  return null;
}

export function phoneError(phone: string): string | null {
  const value = phone.trim();
  if (value.length === 0) return "El teléfono es obligatorio";
  if (!PHONE_RE.test(value)) return "Entre 8 y 14 dígitos numéricos";
  return null;
}
