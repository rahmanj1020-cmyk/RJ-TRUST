import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, doc, setDoc, query, where, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

async function run() {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('id', '==', '382345986'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("No matching user found.");
    process.exit(1);
  }
  
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const newCommission = (data.commission || 0) + 40;
    const newBalance = (data.balance || 0) + 40;
    
    await updateDoc(userDoc.ref, { 
      commission: newCommission,
      balance: newBalance
    });
    
    // Create a transaction record too
    const txRef = doc(collection(db, 'transactions'));
    await setDoc(txRef, {
      id: txRef.id,
      userId: data.phone,
      amount: 40,
      type: 'commission',
      date: new Date().toISOString(),
      timestamp: Date.now(),
      status: 'completed',
      description: 'Manual commission earned added',
      title: 'Commission Earned'
    });
    
    console.log(`Added 40 taka to user ${data.phone} (ID: ${data.id}). New Balance: ${newBalance}, New Commission: ${newCommission}`);
  }
  process.exit(0);
}
run();
