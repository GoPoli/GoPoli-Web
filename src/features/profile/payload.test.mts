import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProfilePayload } from "./payload.ts";

describe("buildProfilePayload", () => {
  it("normalizes profile fields and keeps the selected program", () => {
    assert.deepEqual(
      buildProfilePayload({
        name: "  Ana Pérez  ",
        email: " ANA@ELPOLI.EDU.CO ",
        phone: " 3001234567 ",
        programId: 7,
      }),
      {
        name: "Ana Pérez",
        email: "ana@elpoli.edu.co",
        phone: "3001234567",
        programId: 7,
      },
    );
  });
});
