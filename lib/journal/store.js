import "server-only";

export function serializeEntry(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    observedAt: data.observedAt.toDate().toISOString(),
    notes: data.notes,
    ...(data.eventRef ? { eventRef: data.eventRef } : {}),
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}
