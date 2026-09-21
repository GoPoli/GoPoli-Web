/** Port of `frontend/lib/utils/validaciones.dart`. */

const EMAIL_BASICO =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const NOMBRE_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{2,}$/;

const TELEFONO_RE = /^[0-9]{8,14}$/;

export function mensajeCorreo(correo: string): string | null {
  const c = correo.trim();
  if (c.length === 0) return "El correo es obligatorio";
  if (!EMAIL_BASICO.test(c)) return "Ingresa un correo válido";
  if (!c.toLowerCase().endsWith("@elpoli.edu.co")) {
    return "Usa tu correo @elpoli.edu.co";
  }
  return null;
}

export function mensajeContrasena(pass: string): string | null {
  if (pass.length === 0) return "La contraseña es obligatoria";
  if (pass.length < 8) return "Mínimo 8 caracteres";
  return null;
}

export function mensajeConfirmacion(
  pass: string,
  confirmacion: string,
): string | null {
  if (confirmacion.length === 0) return "Confirma tu contraseña";
  if (pass !== confirmacion) return "Las contraseñas no coinciden";
  return null;
}

export function mensajeNombre(nombre: string): string | null {
  const n = nombre.trim();
  if (n.length === 0) return "El nombre es obligatorio";
  if (!NOMBRE_RE.test(n)) {
    return "Solo letras y espacios (mín. 2 caracteres)";
  }
  return null;
}

export function mensajeTelefono(telefono: string): string | null {
  const t = telefono.trim();
  if (t.length === 0) return "El teléfono es obligatorio";
  if (!TELEFONO_RE.test(t)) {
    return "Entre 8 y 14 dígitos numéricos";
  }
  return null;
}
