import "server-only";
import { ApiError, requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

const headers = { "Cache-Control": "no-store" };
export const MAX_JSON_BYTES = 32 * 1024;

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
  const type = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (type !== "application/json")
    throw new ApiError(415, "Send this request as JSON.");
  const length = request.headers.get("content-length");
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > MAX_JSON_BYTES)
  )
    throw new ApiError(413, "This request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Enter a valid request.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new ApiError(413, "This request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new ApiError(400, "Enter a valid request.");
  }
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
