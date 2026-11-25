import { apiError } from "@/lib/auth";
import {
  ownedCollection,
  privateResponse,
  readObject,
} from "@/lib/private-api";
import { saveResource, serializeSaved } from "@/lib/saved/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const collection = await ownedCollection(request, "saved");
    const snapshot = await collection.orderBy("createdAt", "desc").get();
    return privateResponse({ items: snapshot.docs.map(serializeSaved) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const collection = await ownedCollection(request, "saved");
    const { item, created } = await saveResource(
      collection,
      await readObject(request),
    );
    return privateResponse({ item }, created ? 201 : 200);
  } catch (error) {
    return apiError(error);
  }
}
