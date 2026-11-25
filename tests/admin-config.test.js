import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { isAdminConfigured } from "../lib/firebase/admin";

afterEach(() => vi.unstubAllEnvs());

it("fails closed if production enables an auth or database emulator", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("FIREBASE_PROJECT_ID", "demo-opensky");
  vi.stubEnv("FIREBASE_CLIENT_EMAIL", "test@example.test");
  vi.stubEnv("FIREBASE_PRIVATE_KEY", "test-only-placeholder");
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
  expect(isAdminConfigured()).toBe(false);
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "");
  expect(isAdminConfigured()).toBe(false);
});

it("allows both local emulators only with a demo project outside production", () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("FIREBASE_PROJECT_ID", "demo-opensky");
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:8080");
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
  expect(isAdminConfigured()).toBe(true);
  vi.stubEnv("FIREBASE_PROJECT_ID", "open-sky-e15ed");
  expect(isAdminConfigured()).toBe(false);
  vi.stubEnv("FIREBASE_PROJECT_ID", "demo-opensky");
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", "remote.test:8080");
  expect(isAdminConfigured()).toBe(false);
});
