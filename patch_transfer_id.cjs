const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Update type definition
content = content.replace(
  "transferFunds: (receiverPhone: string, amount: number, password?: string) => { success: boolean; message: string };",
  "transferFunds: (receiverIdOrPhone: string, amount: number, password?: string) => { success: boolean; message: string };"
);

// Update implementation
const oldImpl = `  const transferFunds = (receiverPhone, amount, password) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };
    if (amount > currentUser.balance) return { success: false, message: 'Insufficient balance' };
    if (receiverPhone === currentUser.phone) return { success: false, message: 'Cannot transfer to yourself' };
    if (password !== currentUser.password) return { success: false, message: lang === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Incorrect password' };
    
    const receiver = users[receiverPhone];
    if (!receiver) return { success: false, message: 'Receiver account not found' };`;

const newImpl = `  const transferFunds = (receiverIdOrPhone, amount, password) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };
    if (amount > currentUser.balance) return { success: false, message: 'Insufficient balance' };
    if (receiverIdOrPhone === currentUser.phone || receiverIdOrPhone === currentUser.id) return { success: false, message: 'Cannot transfer to yourself' };
    if (password !== currentUser.password) return { success: false, message: lang === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Incorrect password' };
    
    let receiver = users[receiverIdOrPhone];
    if (!receiver) {
      receiver = Object.values(users).find(u => u.id === receiverIdOrPhone);
    }
    if (!receiver) return { success: false, message: 'Receiver account not found' };`;

content = content.replace(oldImpl, newImpl);

// Ensure the updatedReceiver is saving to the correct phone property
content = content.replace(
  "setUsers(prev => ({ ...prev, [currentUser.phone]: updatedSender, [receiverPhone]: updatedReceiver }));",
  "setUsers(prev => ({ ...prev, [currentUser.phone]: updatedSender, [receiver.phone]: updatedReceiver }));"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
