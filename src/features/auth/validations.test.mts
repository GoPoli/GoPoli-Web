import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  confirmationError,
  emailError,
  nameError,
  passwordError,
  phoneError,
} from "./validations.ts";

describe("emailError", () => {
  it("rejects empty email", () => {
    assert.equal(emailError(""), "El correo es obligatorio");
    assert.equal(emailError("   "), "El correo es obligatorio");
  });

  it("rejects invalid email format", () => {
    assert.equal(emailError("no-es-correo"), "Ingresa un correo válido");
  });

  it("rejects non-institutional domain", () => {
    assert.equal(emailError("user@gmail.com"), "Usa tu correo @elpoli.edu.co");
  });

  it("accepts valid institutional email", () => {
    assert.equal(emailError("estudiante@elpoli.edu.co"), null);
    assert.equal(emailError("  Estudiante@ElPoli.edu.co  "), null);
  });
});

describe("passwordError", () => {
  it("rejects empty password", () => {
    assert.equal(passwordError(""), "La contraseña es obligatoria");
  });

  it("rejects passwords shorter than 8", () => {
    assert.equal(passwordError("1234567"), "Mínimo 8 caracteres");
  });

  it("rejects passwords longer than 72 bytes", () => {
    assert.equal(passwordError("a".repeat(73)), "Máximo 72 caracteres");
  });

  it("accepts passwords with at least 8 characters", () => {
    assert.equal(passwordError("12345678"), null);
  });
});

describe("confirmationError", () => {
  it("rejects empty confirmation", () => {
    assert.equal(confirmationError("password1", ""), "Confirma tu contraseña");
  });

  it("rejects mismatched confirmation", () => {
    assert.equal(confirmationError("password1", "password2"), "Las contraseñas no coinciden");
  });

  it("accepts matching confirmation", () => {
    assert.equal(confirmationError("password1", "password1"), null);
  });
});

describe("nameError", () => {
  it("rejects empty name", () => {
    assert.equal(nameError(""), "El nombre es obligatorio");
    assert.equal(nameError("  "), "El nombre es obligatorio");
  });

  it("rejects names that are too short or have digits", () => {
    assert.equal(nameError("A"), "Solo letras y espacios (entre 3 y 120 caracteres)");
    assert.equal(nameError("Ana2"), "Solo letras y espacios (entre 3 y 120 caracteres)");
  });

  it("accepts valid names with accents", () => {
    assert.equal(nameError("María José"), null);
  });
});

describe("phoneError", () => {
  it("rejects empty phone", () => {
    assert.equal(phoneError(""), "El teléfono es obligatorio");
  });

  it("rejects phones outside 8-14 digits", () => {
    assert.equal(phoneError("1234567"), "Entre 8 y 14 dígitos numéricos");
    assert.equal(phoneError("123456789012345"), "Entre 8 y 14 dígitos numéricos");
    assert.equal(phoneError("12345abc"), "Entre 8 y 14 dígitos numéricos");
  });

  it("accepts phones with 8 to 14 digits", () => {
    assert.equal(phoneError("3001234567"), null);
    assert.equal(phoneError("  3001234567  "), null);
  });
});
