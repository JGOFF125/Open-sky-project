import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase/admin", () => ({
  adminDb: vi.fn(),
  adminAuth: vi.fn(),
  isAdminConfigured: vi.fn(),
}));
import { readObject, MAX_JSON_BYTES } from "../lib/private-api";
import { requireUser } from "../lib/auth";
import { adminAuth, isAdminConfigured } from "../lib/firebase/admin";
import { accountRequest } from "../lib/account-request";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function jsonRequest(body, headers = {}) {
  return new Request("https://opensky.test/api/journal", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("private API request boundaries", () => {
  it("accepts UTF-8 JSON and rejects broken JSON, invalid UTF-8, and non-objects", async () => {
    await expect(readObject(jsonRequest('{"notes":"🌌"}'))).resolves.toEqual({
      notes: "🌌",
    });
    for (const body of ["{", "null", "[]", "1", new Uint8Array([0xff])]) {
      await expect(readObject(jsonRequest(body))).rejects.toMatchObject({
        status: 400,
      });
    }
  });

  it("requires a JSON content type", async () => {
    await expect(
      readObject(jsonRequest("{}", { "Content-Type": "text/plain" })),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      readObject(
        jsonRequest("{}", {
          "Content-Type": "Application/JSON; charset=utf-8",
        }),
      ),
    ).resolves.toEqual({});
  });

  it("rejects oversized declared bodies before reading", async () => {
    await expect(
      readObject(
        jsonRequest("{}", { "Content-Length": String(MAX_JSON_BYTES + 1) }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });

  it("limits chunked payloads by actual bytes and cancels the rest", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_JSON_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel,
    });
    const request = new Request("https://opensky.test/api/journal", {
      method: "POST",
      body,
      duplex: "half",
      headers: { "Content-Type": "application/json" },
    });
    await expect(readObject(request)).rejects.toMatchObject({ status: 413 });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("accepts exactly the byte limit but rejects larger bodies even with a false length", async () => {
    const body = JSON.stringify({ notes: "a".repeat(MAX_JSON_BYTES - 12) });
    expect(Buffer.byteLength(body)).toBe(MAX_JSON_BYTES);
    await expect(readObject(jsonRequest(body))).resolves.toHaveProperty(
      "notes",
    );
    await expect(
      readObject(jsonRequest(body + " ", { "Content-Length": "2" })),
    ).rejects.toMatchObject({ status: 413 });
  });

  it("rejects oversized bearer headers before contacting Firebase", async () => {
    await expect(
      requireUser(
        new Request("https://opensky.test", {
          headers: { Authorization: `Bearer ${"x".repeat(8192)}` },
        }),
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(adminAuth).not.toHaveBeenCalled();
  });

  it("checks token revocation with Firebase", async () => {
    isAdminConfigured.mockReturnValue(true);
    const verifyIdToken = vi.fn().mockResolvedValue({ uid: "first" });
    adminAuth.mockReturnValue({ verifyIdToken });
    await expect(
      requireUser(
        new Request("https://opensky.test", {
          headers: { Authorization: "Bearer example-session" },
        }),
      ),
    ).resolves.toEqual({ uid: "first" });
    expect(verifyIdToken).toHaveBeenCalledWith("example-session", true);
  });
});

it("never obtains or sends an account token to an external or unexpected path", async () => {
  const user = { getIdToken: vi.fn() };
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  for (const path of [
    "https://other.test/api/journal",
    "//other.test",
    "/api/journal/../health",
    "/api/journal?next=x",
    "/api/health",
  ]) {
    await expect(accountRequest(user, path)).rejects.toThrow(
      "valid account endpoint",
    );
  }
  expect(user.getIdToken).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
  user.getIdToken.mockResolvedValue("test-session");
  fetchMock.mockResolvedValue(Response.json({ entries: [] }));
  await expect(accountRequest(user, "/api/journal")).resolves.toEqual({
    entries: [],
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/journal",
    expect.objectContaining({
      headers: { Authorization: "Bearer test-session" },
      cache: "no-store",
    }),
  );
});
