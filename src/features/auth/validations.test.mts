import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mensajeConfirmacion,
  mensajeContrasena,
  mensajeCorreo,
  mensajeNombre,
  mensajeTelefono,
} from "./validations.ts";

describe("mensajeCorreo", () => {
  it("rejects empty email", () => {
    assert.equal(mensajeCorreo(""), "El correo es obligatorio");
    assert.equal(mensajeCorreo("   "), "El correo es obligatorio");
  });

  it("rejects invalid email format", () => {
    assert.equal(mensajeCorreo("no-es-correo"), "Ingresa un correo válido");
  });

  it("rejects non-elpoli domain", () => {
    assert.equal(
      mensajeCorreo("user@gmail.com"),
      "Usa tu correo @elpoli.edu.co",
    );
  });

  it("accepts valid elpoli email", () => {
    assert.equal(mensajeCorreo("estudiante@elpoli.edu.co"), null);
    assert.equal(mensajeCorreo("  Estudiante@ElPoli.edu.co  "), null);
  });
});

describe("mensajeContrasena", () => {
  it("rejects empty password", () => {
    assert.equal(mensajeContrasena(""), "La contraseña es obligatoria");
  });

  it("rejects passwords shorter than 8", () => {
    assert.equal(mensajeContrasena("1234567"), "Mínimo 8 caracteres");
  });

  it("accepts passwords with at least 8 characters", () => {
    assert.equal(mensajeContrasena("12345678"), null);
  });
});

describe("mensajeConfirmacion", () => {
  it("rejects empty confirmation", () => {
    assert.equal(mensajeConfirmacion("password1", ""), "Confirma tu contraseña");
  });

  it("rejects mismatched confirmation", () => {
    assert.equal(
      mensajeConfirmacion("password1", "password2"),
      "Las contraseñas no coinciden",
    );
  });

  it("accepts matching confirmation", () => {
    assert.equal(mensajeConfirmacion("password1", "password1"), null);
  });
});

describe("mensajeNombre", () => {
  it("rejects empty name", () => {
    assert.equal(mensajeNombre(""), "El nombre es obligatorio");
    assert.equal(mensajeNombre("  "), "El nombre es obligatorio");
  });

  it("rejects names that are too short or have digits", () => {
    assert.equal(
      mensajeNombre("A"),
      "Solo letras y espacios (mín. 2 caracteres)",
    );
    assert.equal(
      mensajeNombre("Ana2"),
      "Solo letras y espacios (mín. 2 caracteres)",
    );
  });

  it("accepts valid names with accents", () => {
    assert.equal(mensajeNombre("María José"), null);
  });
});

describe("mensajeTelefono", () => {
  it("rejects empty phone", () => {
    assert.equal(mensajeTelefono(""), "El teléfono es obligatorio");
  });

  it("rejects phones outside 8-14 digits", () => {
    assert.equal(mensajeTelefono("1234567"), "Entre 8 y 14 dígitos numéricos");
    assert.equal(
      mensajeTelefono("123456789012345"),
      "Entre 8 y 14 dígitos numéricos",
    );
    assert.equal(mensajeTelefono("12345abc"), "Entre 8 y 14 dígitos numéricos");
  });

  it("accepts phones with 8 to 14 digits", () => {
    assert.equal(mensajeTelefono("3001234567"), null);
    assert.equal(mensajeTelefono("  3001234567  "), null);
  });
});
