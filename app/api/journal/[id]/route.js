import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { ApiError, apiError } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { validateJournalEntry } from "@/lib/journal/model";
import { serializeEntry } from "@/lib/journal/store";
import {
  ownedDocument,
  privateResponse,
  readObject,
  requireRecord,
} from "@/lib/private-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  try {
    const ref = await ownedDocument(request, context, "journal");
    return privateResponse({
      entry: serializeEntry(requireRecord(await ref.get())),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request, context) {
  try {
    const ref = await ownedDocument(request, context, "journal");
    const changes = await readObject(request);
    if (!Object.keys(changes).length)
      throw new ApiError(400, "Enter a change for this journal entry.");
    await adminDb().runTransaction(async (transaction) => {
      const current = serializeEntry(requireRecord(await transaction.get(ref)));
      const entry = validateJournalEntry({
        title: current.title,
        notes: current.notes,
        observedAt: current.observedAt.slice(0, 10),
        eventRef: current.eventRef ?? null,
        ...changes,
      });
      if (!entry) throw new ApiError(400, "Check the journal entry fields.");
      transaction.update(ref, {
        ...entry,
        eventRef: entry.eventRef ?? FieldValue.delete(),
        observedAt: Timestamp.fromDate(new Date(entry.observedAt)),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return privateResponse({
      entry: serializeEntry(requireRecord(await ref.get())),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request, context) {
  try {
    const ref = await ownedDocument(request, context, "journal");
    await adminDb().runTransaction(async (transaction) => {
      requireRecord(await transaction.get(ref));
      transaction.delete(ref);
    });
    return privateResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
