import { describe, expect, it } from "vitest";
import { normalizeLaunch, countdownState } from "../lib/launches/model";
import {
  refreshDecision,
  REFRESH_MS,
  HOUR_MS,
} from "../lib/launches/cache-policy";

describe("launch data boundaries", () => {
  it("rejects missing identifiers and invalid dates without breaking the feed", () => {
    expect(normalizeLaunch({ name: "No identifier" })).toBeNull();
    expect(
      normalizeLaunch({ id: "1", name: "Mission", net: "unknown" }).net,
    ).toBeNull();
  });
  it("only accepts HTTPS broadcast links and preserves map coordinates", () => {
    const launch = normalizeLaunch({
      id: "1",
      name: "Mission",
      vid_urls: [
        { url: "javascript:alert(1)" },
        { url: "https://example.org/watch" },
      ],
      pad: { latitude: 0, longitude: 0 },
    });
    expect(launch.broadcast).toBe("https://example.org/watch");
    expect(launch.latitude).toBe(0);
  });
  it("does not present imprecise schedules as precise countdowns", () => {
    const launch = normalizeLaunch({
      id: "1",
      name: "Mission",
      net: "2030-01-01T00:00:00Z",
      net_precision: { id: 2 },
    });
    expect(launch.precise).toBe(false);
    expect(countdownState(launch, 0).seconds).toBeNull();
  });
  it("stops a countdown for holds and elapsed schedules", () => {
    const launch = {
      net: "2030-01-01T00:00:00Z",
      precise: true,
      statusId: 5,
      status: "Hold",
    };
    expect(countdownState(launch, 0).label).toBe("Hold");
    expect(
      countdownState({ ...launch, statusId: 1 }, Date.parse(launch.net) + 1000)
        .label,
    ).toBe("Awaiting a schedule update");
  });
});
describe("shared upstream request budget", () => {
  const now = 10 * HOUR_MS;
  it("serves fresh data without claiming an upstream request", () => {
    expect(refreshDecision({ updatedAt: now - REFRESH_MS + 1 }, now)).toBe(
      "fresh",
    );
  });
  it("prevents a concurrent refresh while a lock is held", () => {
    expect(refreshDecision({ lockUntil: now + 1000 }, now)).toBe("locked");
  });
  it("counts unsuccessful attempts against the hourly budget", () => {
    expect(
      refreshDecision(
        { attempts: [now, now - 1000, now - 2000, now - 3000] },
        now,
      ),
    ).toBe("budget");
  });
  it("allows recovery after the lock and budget expire", () => {
    expect(
      refreshDecision(
        { lockUntil: now - 1, attempts: [now - HOUR_MS - 1] },
        now,
      ),
    ).toBe("refresh");
  });
});
