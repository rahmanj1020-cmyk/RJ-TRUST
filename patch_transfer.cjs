const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace(
  "transferFunds: (receiverPhone: string, amount: number) => { success: boolean; message: string };",
  "transferFunds: (receiverPhone: string, amount: number, password?: string) => { success: boolean; message: string };"
);

content = content.replace(
  "const transferFunds = (receiverPhone, amount) => {",
  "const transferFunds = (receiverPhone, amount, password) => {"
);

content = content.replace(
  "if (receiverPhone === currentUser.phone) return { success: false, message: 'Cannot transfer to yourself' };",
  "if (receiverPhone === currentUser.phone) return { success: false, message: 'Cannot transfer to yourself' };\n    if (password !== currentUser.password) return { success: false, message: lang === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Incorrect password' };"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
