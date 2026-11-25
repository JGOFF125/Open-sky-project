import "server-only";
import { ApiError, requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

const headers = { "Cache-Control": "no-store" };

export async function ownedCollection(request, name) {
  const { uid } = await requireUser(request);
  return adminDb().collection("users").doc(uid).collection(name);
}

export async function ownedDocument(request, context, name) {
  const collection = await ownedCollection(request, name);
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,160}$/.test(id))
    throw new ApiError(404, "Item not found.");
  return collection.doc(id);
}

export async function readObject(request) {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Enter a valid request.");
  }
  return value;
}

export function privateResponse(body, status = 200) {
  return status === 204
    ? new Response(null, { status, headers })
    : Response.json(body, { status, headers });
}

export function requireRecord(snapshot) {
  if (!snapshot.exists) throw new ApiError(404, "Item not found.");
  return snapshot;
}
