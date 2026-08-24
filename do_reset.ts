import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  await setDoc(doc(db, 'adminWallet', 'main'), {
    feeBalance: 0,
    totalCollected: 0,
    totalWithdrawn: 0,
    updatedAt: Date.now()
  });

  const txSnap = await getDocs(collection(db, 'transactions'));
  for (const txDoc of txSnap.docs) {
    await deleteDoc(doc(db, 'transactions', txDoc.id));
  }
  
  const reqSnap = await getDocs(collection(db, 'requests'));
  for (const reqDoc of reqSnap.docs) {
    await deleteDoc(doc(db, 'requests', reqDoc.id));
  }

  const feeTxSnap = await getDocs(collection(db, 'adminFeeTransactions'));
  for (const feeTxDoc of feeTxSnap.docs) {
    await deleteDoc(doc(db, 'adminFeeTransactions', feeTxDoc.id));
  }

  console.log("All amounts reset to 000!");
  process.exit(0);
}
run();
