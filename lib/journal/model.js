const TITLE_LIMIT = 120;
const NOTES_LIMIT = 5000;
const EVENT_ID_LIMIT = 160;

export function validateJournalEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const notes = typeof value.notes === "string" ? value.notes.trim() : "";
  const observedAt = value.observedAt;

  if (
    !title ||
    title.length > TITLE_LIMIT ||
    notes.length > NOTES_LIMIT ||
    typeof observedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(observedAt)
  ) {
    return null;
  }

  const date = new Date(`${observedAt}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== observedAt)
    return null;

  let eventRef;
  if (value.eventRef != null) {
    const { resourceType, resourceId } = value.eventRef;
    if (
      !["launch", "telescope"].includes(resourceType) ||
      typeof resourceId !== "string" ||
      !resourceId.trim() ||
      resourceId.trim().length > EVENT_ID_LIMIT
    ) {
      return null;
    }
    eventRef = { resourceType, resourceId: resourceId.trim() };
  }

  return {
    title,
    notes,
    observedAt: date.toISOString(),
    ...(eventRef ? { eventRef } : {}),
  };
}