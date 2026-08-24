const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Add definition in type
content = content.replace(
  "adminDeleteUser: (phone: string) => { success: boolean; message: string };",
  "adminDeleteUser: (phone: string) => { success: boolean; message: string };\n  adminToggleUserStatus: (phone: string) => { success: boolean; message: string; newStatus: string };"
);

// Add implementation
const deleteImpl = `  const adminDeleteUser = (phone: string) => {`;
const newImpl = `  const adminToggleUserStatus = (phone: string) => {
    const cleanPhone = phone.trim();
    const targetUser = users[cleanPhone];
    if (!targetUser) return { success: false, message: 'User not found', newStatus: '' };
    
    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    
    const updatedUser = {
      ...targetUser,
      status: newStatus
    };
    
    setUsers(prev => ({ ...prev, [cleanPhone]: updatedUser }));
    persistUserToFirestore(updatedUser);
    
    return { success: true, message: \`User \${targetUser.fullName} \${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully\`, newStatus };
  };

  const adminDeleteUser = (phone: string) => {`;

content = content.replace(deleteImpl, newImpl);

// Export it
content = content.replace(
  "adminDeleteUser,",
  "adminDeleteUser,\n        adminToggleUserStatus,"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
