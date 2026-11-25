import { describe, expect, it } from "vitest";
import sources from "../data/telescopes.json";
import { parseSolarImage } from "../lib/telescopes/solar-image";
describe("Telescope source records", () => {
  it("contains seven unique free resources with verification and access requirements", () => {
    expect(sources).toHaveLength(7);
    expect(new Set(sources.map(({ id }) => id)).size).toBe(7);
    for (const source of sources) {
      expect(source.cost).toBe("free");
      expect(new URL(source.providerUrl).protocol).toBe("https:");
      expect(new URL(source.verificationUrl).protocol).toBe("https:");
      expect([
        "broadcast",
        "telescope-images",
        "telescope-replay",
        "image-request",
        "course-access",
        "webcam",
        "observation-info",
      ]).toContain(source.accessType);
      expect(source.requirements.length).toBeGreaterThan(0);
      expect(source.limitations.length).toBeGreaterThan(0);
      expect(source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("keeps space telescopes off Earth markers and labels approximate ground positions", () => {
    expect(
      sources.find(({ id }) => id === "space-telescope-live").latitude,
    ).toBeNull();
    for (const source of sources.filter(({ latitude }) => latitude !== null)) {
      expect(Math.abs(source.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(source.longitude)).toBeLessThanOrEqual(180);
      expect(source.locationNotes.length).toBeGreaterThan(0);
    }
  });
});

describe("Cerro Tololo latest-image feed", () => {
  const feed = "/HA/hav/202611/20261124/20261124223042Ch.jpg:705";
  it("uses the telescope exposure time and the official image host", () => {
    expect(parseSolarImage(feed + "\n")).toEqual({
      capturedAt: "2026-11-24T22:30:42.000Z",
      imageUrl:
        "https://gong2.nso.edu/ftp/HA/hav/202611/20261124/20261124223042Ch.jpg",
    });
  });
  it("rejects other stations, invalid timestamps, and unexpected image paths", () => {
    for (const invalid of [
      feed.replace("Ch", "Bh"),
      feed.replaceAll("20261124", "20261131"),
      feed.replace("/202611/", "/202610/"),
      "https://example.org/frame.jpg:4",
      "Unavailable",
    ]) {
      expect(parseSolarImage(invalid)).toBeNull();
    }
  });
});
