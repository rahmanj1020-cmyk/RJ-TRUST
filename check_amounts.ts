import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  const reqSnap = await getDocs(collection(db, 'requests'));
  let d = 0; let w = 0;
  reqSnap.docs.forEach(doc => {
    if (doc.data().type === 'deposit') d += doc.data().amount;
    if (doc.data().type === 'withdrawal') w += doc.data().amount;
  });
  console.log("Deposits:", d, "Withdrawals:", w, "Total Docs:", reqSnap.size);
  process.exit(0);
}
run();
