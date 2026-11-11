import "server-only";
import { randomUUID } from "node:crypto";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { demoLaunches } from "./demo";
import { normalizeLaunch } from "./model";
import { refreshDecision, LOCK_MS, HOUR_MS, REFRESH_MS } from "./cache-policy";

export async function getLaunchFeed() {
  if (process.env.OPENSKY_DATA_MODE !== "live")
    return {
      launches: demoLaunches,
      mode: "demo",
      stale: false,
      updatedAt: null,
      unavailable: false,
    };
  if (!isAdminConfigured()) return unavailable();
  try {
    return await cachedFeed();
  } catch {
    return unavailable();
  }
}

function unavailable() {
  return {
    launches: [],
    mode: "live",
    stale: true,
    updatedAt: null,
    unavailable: true,
  };
}
function feed(cache) {
  return {
    launches: cache.launches ?? [],
    mode: "live",
    updatedAt: cache.updatedAt ?? null,
    stale: !cache.updatedAt || Date.now() - cache.updatedAt >= REFRESH_MS,
    unavailable: !cache.launches?.length,
  };
}

async function cachedFeed() {
  const ref = adminDb().collection("launchCache").doc("upcoming");
  const now = Date.now();
  const token = randomUUID();
  const claim = await adminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const cache = snapshot.data() ?? {};
    if (refreshDecision(cache, now) !== "refresh")
      return { claimed: false, cache };
    const attempts = [
      ...(cache.attempts ?? []).filter((time) => now - time < HOUR_MS),
      now,
    ];
    transaction.set(
      ref,
      { lockUntil: now + LOCK_MS, lockToken: token, attempts },
      { merge: true },
    );
    return { claimed: true, cache };
  });
  if (!claim.claimed) return feed(claim.cache);
  let launches;
  try {
    const response = await fetch(
      "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=24&mode=normal",
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) throw new Error("UPSTREAM_UNAVAILABLE");
    const data = await response.json();
    if (!Array.isArray(data.results))
      throw new Error("INVALID_UPSTREAM_RESPONSE");
    launches = data.results.map(normalizeLaunch).filter(Boolean);
    if (data.results.length && !launches.length)
      throw new Error("INVALID_LAUNCHES");
  } catch {
    await release(ref, token);
    return { ...feed(claim.cache), stale: true };
  }
  const updatedAt = Date.now();
  const published = await adminDb().runTransaction(async (transaction) => {
    const current = (await transaction.get(ref)).data() ?? {};
    if (current.lockToken !== token) return current;
    transaction.set(
      ref,
      { launches, updatedAt, lockUntil: 0, lockToken: null },
      { merge: true },
    );
    return { launches, updatedAt };
  });
  return feed(published);
}

async function release(ref, token) {
  await adminDb().runTransaction(async (transaction) => {
    const cache = (await transaction.get(ref)).data();
    if (cache?.lockToken === token)
      transaction.set(ref, { lockUntil: 0, lockToken: null }, { merge: true });
  });
}
