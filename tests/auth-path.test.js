import { describe, expect, it } from "vitest";
import { safeNextPath } from "../lib/auth-path";
describe("sign-in destination", () => {
  it("preserves internal paths and query strings", () => {
    expect(safeNextPath("/journal?entry=1#notes")).toBe(
      "/journal?entry=1#notes",
    );
  });
  it.each([
    null,
    "https://example.org",
    "//example.org",
    "/\\example.org",
    "/\n/example.org",
    "/login",
    "/register",
  ])("rejects unsafe destinations and sign-in loops: %s", (path) => {
    expect(safeNextPath(path)).toBe("/saved");
  });
});
