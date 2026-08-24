import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const userDoc of usersSnap.docs) {
    await setDoc(doc(db, 'users', userDoc.id), { balance: 0 }, { merge: true });
  }
  console.log("Users balances reset to 0!");
  process.exit(0);
}
run();
