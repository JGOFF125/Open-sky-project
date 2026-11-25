import { readFile } from "node:fs/promises";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (isEmulator) {
  if (
    !projectId?.startsWith("demo-") ||
    !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST)
  ) {
    throw new Error("Use a loopback emulator and a demo Firebase project.");
  }
} else if (
  !projectId ||
  process.argv[2] !== projectId ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  throw new Error(
    "Pass the configured Firebase project ID and supply its server credentials.",
  );
}
const options = { projectId };
if (!isEmulator) {
  options.credential = cert({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
}
const app = initializeApp(options);
try {
  const records = JSON.parse(
    await readFile(new URL("../data/telescopes.json", import.meta.url), "utf8"),
  );
  const db = getFirestore(app);
  const batch = db.batch();
  for (const record of records)
    batch.set(db.collection("telescopes").doc(record.id), record);
  await batch.commit();
  console.log(
    `Seeded ${records.length} telescope source records in ${projectId}`,
  );
} finally {
  await deleteApp(app);
}
