import { describe, expect, it } from "vitest";
import { validateJournalEntry } from "../lib/journal/model";

describe("journal entry validation", () => {
  it("normalizes valid fields and accepts an optional resource reference", () => {
    expect(
      validateJournalEntry({
        title: "  Jupiter watch  ",
        observedAt: "2026-11-23",
        notes: "  Clear skies.  ",
        eventRef: { resourceType: "launch", resourceId: "mission-1" },
      }),
    ).toEqual({
      title: "Jupiter watch",
      observedAt: "2026-11-23T00:00:00.000Z",
      notes: "Clear skies.",
      eventRef: { resourceType: "launch", resourceId: "mission-1" },
    });
  });

  it("rejects invalid dates, oversized text, and malformed references", () => {
    expect(
      validateJournalEntry({
        title: "Watch",
        observedAt: "2026-02-30",
        notes: "",
      }),
    ).toBeNull();
    expect(
      validateJournalEntry({ title: " ", observedAt: "2026-11-23", notes: "" }),
    ).toBeNull();
    expect(
      validateJournalEntry({
        title: "Watch",
        observedAt: "2026-11-23",
        notes: "",
        eventRef: { resourceType: "unknown", resourceId: "item" },
      }),
    ).toBeNull();
  });
});
