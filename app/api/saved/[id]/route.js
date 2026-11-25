import { FieldValue } from "firebase-admin/firestore";
import { ApiError, apiError } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  ownedDocument,
  privateResponse,
  readObject,
  requireRecord,
} from "@/lib/private-api";
import { savedNote, serializeSaved } from "@/lib/saved/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const ref = await ownedDocument(request, context, "saved");
    return privateResponse({
      item: serializeSaved(requireRecord(await ref.get())),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request, context) {
  try {
    const ref = await ownedDocument(request, context, "saved");
    const body = await readObject(request);
    if (Object.keys(body).length !== 1 || !Object.hasOwn(body, "note"))
      throw new ApiError(400, "Only the note can be changed.");
    const note = savedNote(body.note);
    await adminDb().runTransaction(async (transaction) => {
      requireRecord(await transaction.get(ref));
      transaction.update(ref, {
        note,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return privateResponse({
      item: serializeSaved(requireRecord(await ref.get())),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request, context) {
  try {
    const ref = await ownedDocument(request, context, "saved");
    await adminDb().runTransaction(async (transaction) => {
      requireRecord(await transaction.get(ref));
      transaction.delete(ref);
    });
    return privateResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
