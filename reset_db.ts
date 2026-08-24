import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  await setDoc(doc(db, 'settings', 'adminCredentials'), {
    adminId: '1020304',
    adminPw: 'admin1234',
    updatedAt: Date.now()
  });
  console.log("SUCCESS");
  process.exit(0);
}
run();
