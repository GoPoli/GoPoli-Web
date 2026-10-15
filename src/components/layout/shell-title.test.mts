import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isWithin, shellTitle } from "./shell-title.ts";

const sections = [
  { href: "/trips", title: "Viajes" },
  { href: "/groups", title: "Grupo" },
];

describe("shellTitle", () => {
  it("uses the title of the section that contains the route", () => {
    assert.equal(shellTitle("/trips", sections), "Viajes");
    assert.equal(shellTitle("/trips/new", sections), "Viajes");
    assert.equal(shellTitle("/groups/1", sections), "Grupo");
  });

  it("returns null outside every section instead of repeating the brand", () => {
    assert.equal(shellTitle("/", sections), null);
    assert.equal(shellTitle("/tripsx", sections), null);
  });
});

describe("isWithin", () => {
  it("matches the section root and its subroutes only", () => {
    assert.equal(isWithin("/messages/4", "/messages"), true);
    assert.equal(isWithin("/messagesx", "/messages"), false);
  });
});
