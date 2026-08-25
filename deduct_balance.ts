import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  let found = false;
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (data.id === '382345986') {
      found = true;
      const oldBalance = Number(data.balance || 0);
      const newBalance = oldBalance - 100;
      await updateDoc(doc(db, 'users', userDoc.id), { balance: newBalance });
      console.log(`Updated user ${userDoc.id} (${data.id}). Balance changed from ${oldBalance} to ${newBalance}.`);
    }
  }
  if (!found) {
    console.log('User with ID 382345986 not found.');
  }
  process.exit(0);
}
run().catch(console.error);
