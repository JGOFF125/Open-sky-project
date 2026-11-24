export const REFRESH_MS = 15 * 60 * 1000;
export const LOCK_MS = 30 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

export function refreshDecision(cache, now) {
  if (cache.updatedAt && now - cache.updatedAt < REFRESH_MS) return "fresh";
  if ((cache.lockUntil ?? 0) > now) return "locked";
  const recent = (cache.attempts ?? []).filter((time) => now - time < HOUR_MS);
  if (recent.length >= 4) return "budget";
  if (recent.some((time) => now - time < REFRESH_MS)) return "backoff";
  return "refresh";
}
