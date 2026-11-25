import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { ApiError } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getLaunchFeed } from "@/lib/launches/service";
import { getTelescopeCatalog } from "@/lib/telescopes/catalog";

export function savedId(type, id) {
  return createHash("sha256").update(`${type}:${id}`).digest("hex");
}

export function savedNote(value) {
  if (typeof value !== "string" || value.trim().length > 1000) {
    throw new ApiError(400, "Enter a note with up to 1,000 characters.");
  }
  return value.trim();
}

export function serializeSaved(snapshot) {
  const { resourceType, resourceId, title, note, createdAt, updatedAt } =
    snapshot.data();
  return {
    id: snapshot.id,
    resourceType,
    resourceId,
    title,
    note,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
  };
}

export async function saveResource(collection, value) {
  const { resourceType, resourceId } = value;
  if (
    Object.keys(value).some(
      (key) => !["resourceType", "resourceId", "title", "note"].includes(key),
    ) ||
    !["launch", "telescope"].includes(resourceType) ||
    typeof resourceId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,160}$/.test(resourceId)
  ) {
    throw new ApiError(400, "Choose a valid launch or telescope resource.");
  }
  const note = savedNote(value.note === undefined ? "" : value.note);
  const ref = collection.doc(savedId(resourceType, resourceId));
  const existing = await ref.get();
  if (existing.exists)
    return { item: serializeSaved(existing), created: false };

  let resources;
  if (resourceType === "launch") {
    const feed = await getLaunchFeed();
    if (feed.unavailable)
      throw new ApiError(503, "Launch data is temporarily unavailable.");
    resources = feed.launches;
  } else {
    resources = (await getTelescopeCatalog()).telescopes;
  }
  const resource = resources.find((item) => item.id === resourceId);
  if (!resource)
    throw new ApiError(404, "That resource is no longer available.");
  const created = await adminDb().runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    if (current.exists) return false;
    const timestamp = FieldValue.serverTimestamp();
    transaction.create(ref, {
      resourceType,
      resourceId,
      title: resource.name,
      note,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return true;
  });
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new ApiError(404, "That saved item was removed.");
  return { item: serializeSaved(snapshot), created };
}
