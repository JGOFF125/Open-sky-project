import { expect, it } from "vitest";
import { secretFindings } from "../lib/security/secret-patterns.mjs";

it("flags credential patterns without returning their values", () => {
  const key = "AI" + "za" + "z".repeat(35);
  const privateKey = "-----BEGIN " + "PRIVATE KEY-----";
  expect(secretFindings(`example\n${key}\n${privateKey}`)).toEqual([
    { type: "Google API key", line: 2 },
    { type: "Private key", line: 3 },
  ]);
  expect(JSON.stringify(secretFindings(key))).not.toContain(key);
});

it("allows blank configuration examples and demo emulator keys", () => {
  expect(
    secretFindings(
      "NEXT_PUBLIC_FIREBASE_API_KEY=\nFIREBASE_PRIVATE_KEY=\nkey=demo-key",
    ),
  ).toEqual([]);
});
