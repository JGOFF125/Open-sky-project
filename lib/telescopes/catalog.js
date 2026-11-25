import "server-only";
import sources from "@/data/telescopes.json";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { isHttpsUrl } from "@/lib/launches/model";

function matchingValue(value, sample) {
  if (sample === null) return value === null;
  if (Array.isArray(sample)) {
    return (
      Array.isArray(value) && value.every((item) => typeof item === "string")
    );
  }
  return typeof value === typeof sample;
}

function readSource(snapshot, template) {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  const fields = Object.keys(template).filter((field) => field !== "id");
  if (
    !fields.every((field) => matchingValue(data[field], template[field])) ||
    !isHttpsUrl(data.providerUrl) ||
    !isHttpsUrl(data.verificationUrl) ||
    data.accessType !== template.accessType ||
    data.cost !== "free" ||
    (data.latitude !== null &&
      (!Number.isFinite(data.latitude) || Math.abs(data.latitude) > 90)) ||
    (data.longitude !== null &&
      (!Number.isFinite(data.longitude) || Math.abs(data.longitude) > 180))
  ) {
    return null;
  }
  return {
    id: template.id,
    ...Object.fromEntries(fields.map((field) => [field, data[field]])),
  };
}

export async function getTelescopeCatalog() {
  if (isAdminConfigured()) {
    try {
      const db = adminDb();
      const refs = sources.map(({ id }) => db.collection("telescopes").doc(id));
      const snapshots = await db.getAll(...refs);
      const telescopes = snapshots.map((snapshot, index) =>
        readSource(snapshot, sources[index]),
      );
      if (telescopes.every(Boolean)) return { telescopes, source: "firestore" };
    } catch {
      return { telescopes: sources, source: "bundled" };
    }
  }
  return { telescopes: sources, source: "bundled" };
}
