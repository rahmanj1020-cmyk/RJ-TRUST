import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : getFirestore(app);

async function run() {
  const snap = await getDoc(doc(db, 'settings', 'adminCredentials'));
  if (snap.exists()) {
    console.log("Admin credentials in DB:", snap.data());
  } else {
    console.log("No admin credentials found in DB.");
  }
  process.exit(0);
}
run().catch(console.error);
