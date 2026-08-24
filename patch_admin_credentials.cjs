const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const persistToFirestore = `
  const adminChangeCredentials = async (newAdminId: string, newPass: string) => {
    const cleanId = (newAdminId || '').trim();
    if (!cleanId || cleanId.length < 3) {
      return { success: false, message: 'Admin ID must be at least 3 characters' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    setAdminId(cleanId);
    setAdminPw(newPass);
    localStorage.setItem(MASTER_ADMIN_ID_KEY, cleanId);
    localStorage.setItem(MASTER_ADMIN_PASS_KEY, newPass);
    
    try {
      await setDoc(doc(db, 'adminSettings', 'credentials'), {
        adminId: cleanId,
        adminPw: newPass,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to sync admin credentials to Firestore', err);
    }
    
    showToast('Master Admin credentials updated successfully!', 'success');
    return { success: true, message: 'Credentials updated' };
  };`;

// Replace old adminChangeCredentials
content = content.replace(
  /const adminChangeCredentials = \(newAdminId: string, newPass: string\) => \{[\s\S]*?return \{ success: true, message: 'Credentials updated' \};\n  \};/,
  persistToFirestore
);

// Add useEffect to load admin credentials from Firestore
const adminUseEffect = `
  // Sync admin credentials from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'adminSettings', 'credentials'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminId) setAdminId(data.adminId);
          if (data.adminPw) setAdminPw(data.adminPw);
          localStorage.setItem(MASTER_ADMIN_ID_KEY, data.adminId);
          localStorage.setItem(MASTER_ADMIN_PASS_KEY, data.adminPw);
        }
      });
      return () => unsub();
    } catch (err) {
      console.error('Failed to sync admin credentials', err);
    }
  }, []);
`;

// Insert the new useEffect below the supportMessages useEffect
content = content.replace(
  "// Backup everything to localStorage",
  adminUseEffect + "\n  // Backup everything to localStorage"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
