import { doc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export const forceResetAdmin = async () => {
  await setDoc(doc(db, 'settings', 'adminCredentials'), {
    adminId: '1020304',
    adminPw: 'admin1234',
    updatedAt: Date.now()
  });
  console.log("Admin credentials reset to default!");
};
