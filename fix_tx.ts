import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  const txRef = collection(db, 'transactions');
  const q = query(txRef, where('type', '==', 'commission'));
  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.title === 'Commission Earned' && data.date && data.date.includes('T')) {
      await updateDoc(docSnap.ref, { 
        date: data.date.slice(0, 10),
        titleBn: 'কমিশন যোগ করা হয়েছে'
      });
      console.log(`Updated transaction ${docSnap.id}`);
    }
  }
  process.exit(0);
}
run();
