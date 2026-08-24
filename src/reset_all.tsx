import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export const forceResetAllStats = async () => {
  // 1. Reset admin wallet
  await setDoc(doc(db, 'adminWallet', 'main'), {
    feeBalance: 0,
    totalCollected: 0,
    totalWithdrawn: 0,
    updatedAt: Date.now()
  });

  // 2. Delete all transactions
  const txSnap = await getDocs(collection(db, 'transactions'));
  for (const txDoc of txSnap.docs) {
    await deleteDoc(doc(db, 'transactions', txDoc.id));
  }
  
  // 3. Delete all requests
  const reqSnap = await getDocs(collection(db, 'requests'));
  for (const reqDoc of reqSnap.docs) {
    await deleteDoc(doc(db, 'requests', reqDoc.id));
  }

  // 4. Delete all adminFeeTransactions
  const feeTxSnap = await getDocs(collection(db, 'adminFeeTransactions'));
  for (const feeTxDoc of feeTxSnap.docs) {
    await deleteDoc(doc(db, 'adminFeeTransactions', feeTxDoc.id));
  }

  // 5. Reset all user balances
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const userDoc of usersSnap.docs) {
    await setDoc(doc(db, 'users', userDoc.id), { balance: 0 }, { merge: true });
  }

  console.log("All amounts reset to 000!");
};
