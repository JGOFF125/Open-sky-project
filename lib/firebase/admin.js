import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function isAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}
function adminApp() {
  if (!isAdminConfigured()) throw new Error("FIREBASE_NOT_CONFIGURED");
  return (
    getApps().find((app) => app.name === "opensky-server") ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      },
      "opensky-server",
    )
  );
}
export const adminDb = () => getFirestore(adminApp());
export const adminAuth = () => getAuth(adminApp());
