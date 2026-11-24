import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { ApiError, apiError, requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { validateJournalEntry } from "@/lib/journal/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeEntry(snapshot) {
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

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const snapshot = await adminDb()
      .collection("users")
      .doc(user.uid)
      .collection("journal")
      .orderBy("observedAt", "desc")
      .limit(100)
      .get();

    return Response.json(
      { entries: snapshot.docs.map(serializeEntry) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    let body;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Enter a valid journal entry.");
    }

    const entry = validateJournalEntry(body);
    if (!entry) throw new ApiError(400, "Check the journal entry fields.");

    const entryRef = adminDb()
      .collection("users")
      .doc(user.uid)
      .collection("journal")
      .doc();
    const timestamp = FieldValue.serverTimestamp();

    await entryRef.set({
      ...entry,
      observedAt: Timestamp.fromDate(new Date(entry.observedAt)),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const created = await entryRef.get();
    return Response.json(
      { entry: serializeEntry(created) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
