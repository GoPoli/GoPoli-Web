import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProfilePayload } from "./payload.ts";

describe("buildProfilePayload", () => {
  it("normalizes profile fields and keeps the selected career", () => {
    assert.deepEqual(
      buildProfilePayload({
        nombre: "  Ana Pérez  ",
        correo: " ANA@ELPOLI.EDU.CO ",
        tel: " 3001234567 ",
        idCarrera: 7,
      }),
      {
        nombre: "Ana Pérez",
        correo: "ana@elpoli.edu.co",
        tel: "3001234567",
        idCarrera: "7",
      },
    );
  });
});
