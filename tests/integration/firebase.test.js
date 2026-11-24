import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
vi.mock("server-only", () => ({}));
import { adminDb } from "../../lib/firebase/admin";
import { GET, POST } from "../../app/api/journal/route";
import { getLaunchFeed } from "../../lib/launches/service";
import { HOUR_MS, REFRESH_MS } from "../../lib/launches/cache-policy";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const local =
  process.env.FIREBASE_AUTH_EMULATOR_HOST === "127.0.0.1:9099" &&
  process.env.FIRESTORE_EMULATOR_HOST === "127.0.0.1:8080";
let first;
let second;
async function account() {
  const response = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${randomUUID()}@opensky.test`,
        password: "test-only-password-123",
        returnSecureToken: true,
      }),
    },
  );
  expect(response.ok).toBe(true);
  return response.json();
}
function request(token, body) {
  return new Request("http://localhost/api/journal", {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe.skipIf(!local)("Firebase local emulator integration", () => {
  beforeAll(async () => {
    process.env.FIREBASE_PROJECT_ID = "demo-opensky";
    [first, second] = await Promise.all([account(), account()]);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await adminDb().terminate();
  });

  it("supports Dialyn's register, sign out, and sign in operations with the client SDK", async () => {
    const app = initializeApp(
      { apiKey: "demo-key", projectId: "demo-opensky" },
      randomUUID(),
    );
    try {
      const auth = getAuth(app);
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      const email = `${randomUUID()}@opensky.test`;
      const created = await createUserWithEmailAndPassword(
        auth,
        email,
        "test-only-password-123",
      );
      const uid = created.user.uid;
      await signOut(auth);
      expect(auth.currentUser).toBeNull();
      const signedIn = await signInWithEmailAndPassword(
        auth,
        email,
        "test-only-password-123",
      );
      expect(signedIn.user.uid).toBe(uid);
      expect(
        (await GET(request(await signedIn.user.getIdToken()))).status,
      ).toBe(200);
      await signOut(auth);
    } finally {
      await deleteApp(app);
    }
  });

  it("rejects anonymous and invalid-token journal requests", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await POST(request(null, { title: "No account" }))).status).toBe(
      401,
    );
    expect((await GET(request("not-a-valid-token"))).status).toBe(401);
  });
  it("persists an entry in the verified owner's collection and keeps another account separate", async () => {
    const response = await POST(
      request(first.idToken, {
        title: "  Clear sky  ",
        observedAt: "2026-11-24",
        notes: "Jupiter observation",
      }),
    );
    expect(response.status).toBe(201);
    const { entry } = await response.json();
    expect(entry.title).toBe("Clear sky");
    expect(entry.createdAt).toMatch(/Z$/);
    expect(
      (
        await adminDb()
          .collection("users")
          .doc(first.localId)
          .collection("journal")
          .doc(entry.id)
          .get()
      ).exists,
    ).toBe(true);
    const own = await GET(request(first.idToken));
    expect(own.headers.get("cache-control")).toBe("no-store");
    expect((await own.json()).entries.map(({ id }) => id)).toContain(entry.id);
    expect((await (await GET(request(second.idToken))).json()).entries).toEqual(
      [],
    );
    const nextSignIn = await fetch(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: first.email,
          password: "test-only-password-123",
          returnSecureToken: true,
        }),
      },
    );
    const signedIn = await nextSignIn.json();
    expect(
      (await (await GET(request(signedIn.idToken))).json()).entries.map(
        ({ id }) => id,
      ),
    ).toContain(entry.id);
  });
  it("rejects malformed dates, unexpected ownership fields, invalid types, and broken JSON", async () => {
    const base = { title: "Observation", observedAt: "2026-11-24", notes: "" };
    for (const body of [
      { ...base, observedAt: "2026-02-30" },
      { ...base, uid: second.localId },
      { ...base, notes: 42 },
      { ...base, eventRef: [] },
    ]) {
      expect((await POST(request(first.idToken, body))).status).toBe(400);
    }
    const broken = new Request("http://localhost/api/journal", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${first.idToken}`,
        "Content-Type": "application/json",
      },
      body: "{",
    });
    expect((await POST(broken)).status).toBe(400);
  });
  it("blocks browser-style unauthenticated Firestore reads and writes", async () => {
    const url =
      "http://127.0.0.1:8080/v1/projects/demo-opensky/databases/(default)/documents/telescopes/test";
    expect((await fetch(url)).status).toBe(403);
    expect(
      (
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: { name: { stringValue: "Blocked" } },
          }),
        })
      ).status,
    ).toBe(403);
  });
  it("refreshes through one shared transaction claim and then serves cached detailed launch data", async () => {
    process.env.OPENSKY_DATA_MODE = "live";
    const ref = adminDb().collection("launchCache").doc("upcoming");
    await ref.delete();
    const nativeFetch = global.fetch;
    let upstream = 0;
    vi.spyOn(global, "fetch").mockImplementation(async (input, init) => {
      if (String(input).startsWith("https://ll.thespacedevs.com/")) {
        upstream++;
        expect(String(input)).toContain("mode=detailed");
        return Response.json({
          results: [
            {
              id: "test-launch",
              name: "Rocket | Test mission",
              net: "2030-01-01T00:00:00Z",
              net_precision: { id: 1, name: "Minute" },
              status: { id: 1, name: "Go for Launch" },
              vid_urls: [{ url: "https://example.org/broadcast" }],
            },
          ],
        });
      }
      return nativeFetch(input, init);
    });
    await Promise.all(Array.from({ length: 5 }, () => getLaunchFeed()));
    const feed = await getLaunchFeed();
    expect(upstream).toBe(1);
    expect(feed.launches[0].broadcast).toBe("https://example.org/broadcast");
    expect(feed.stale).toBe(false);
  });
  it("retains stale data on upstream failure, counts failed attempts, and respects the budget", async () => {
    const ref = adminDb().collection("launchCache").doc("upcoming");
    const now = Date.now();
    await ref.set({
      launches: [{ id: "previous", name: "Previous mission" }],
      updatedAt: now - REFRESH_MS - 1,
      attempts: [],
      lockUntil: 0,
    });
    const nativeFetch = global.fetch;
    let upstream = 0;
    vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if (String(input).startsWith("https://ll.thespacedevs.com/")) {
        upstream++;
        return Promise.resolve(new Response("Unavailable", { status: 429 }));
      }
      return nativeFetch(input, init);
    });
    const failed = await getLaunchFeed();
    expect(failed.launches[0].id).toBe("previous");
    expect(failed.stale).toBe(true);
    expect((await ref.get()).data().attempts).toHaveLength(1);
    await getLaunchFeed();
    expect(upstream).toBe(1);
    await ref.set(
      { attempts: [now, now - 1000, now - 2000, now - 3000] },
      { merge: true },
    );
    expect((await getLaunchFeed()).launches[0].id).toBe("previous");
    expect(upstream).toBe(1);
    await ref.set(
      { attempts: [now - HOUR_MS - 1], lockUntil: now + 30000 },
      { merge: true },
    );
    await getLaunchFeed();
    expect(upstream).toBe(1);
  });
  it("treats a valid empty launch response as an empty feed rather than an outage", async () => {
    const ref = adminDb().collection("launchCache").doc("upcoming");
    await ref.delete();
    const nativeFetch = global.fetch;
    vi.spyOn(global, "fetch").mockImplementation((input, init) =>
      String(input).startsWith("https://ll.thespacedevs.com/")
        ? Promise.resolve(Response.json({ results: [] }))
        : nativeFetch(input, init),
    );
    const feed = await getLaunchFeed();
    expect(feed.launches).toEqual([]);
    expect(feed.unavailable).toBe(false);
    expect(feed.stale).toBe(false);
  });
  it("retains the old feed if a successful upstream refresh cannot be written to Firestore", async () => {
    const db = adminDb();
    const ref = db.collection("launchCache").doc("upcoming");
    await ref.set({
      launches: [{ id: "old", name: "Previous mission" }],
      updatedAt: Date.now() - REFRESH_MS - 1,
      attempts: [],
      lockUntil: 0,
    });
    const nativeFetch = global.fetch;
    vi.spyOn(global, "fetch").mockImplementation((input, init) =>
      String(input).startsWith("https://ll.thespacedevs.com/")
        ? Promise.resolve(
            Response.json({ results: [{ id: "new", name: "New mission" }] }),
          )
        : nativeFetch(input, init),
    );
    const transaction = db.runTransaction.bind(db);
    let calls = 0;
    vi.spyOn(db, "runTransaction").mockImplementation((...args) =>
      ++calls === 2
        ? Promise.reject(new Error("Temporary write failure"))
        : transaction(...args),
    );
    const result = await getLaunchFeed();
    expect(result.launches[0].id).toBe("old");
    expect(result.stale).toBe(true);
    expect(result.unavailable).toBe(false);
    expect((await ref.get()).data().lockUntil).toBe(0);
  });
});
