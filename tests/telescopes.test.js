import { describe, expect, it } from "vitest";
import sources from "../data/telescopes.json";
describe("November 20 telescope source records", () => {
  it("contains five unique free resources with verification and access requirements", () => {
    expect(sources).toHaveLength(5);
    expect(new Set(sources.map(({ id }) => id)).size).toBe(5);
    for (const source of sources) {
      expect(source.cost).toBe("free");
      expect(new URL(source.providerUrl).protocol).toBe("https:");
      expect(new URL(source.verificationUrl).protocol).toBe("https:");
      expect([
        "broadcast",
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
