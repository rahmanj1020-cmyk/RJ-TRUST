const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const targetFunc = `  const transferFunds = (receiverIdOrPhone, amount, password) => {`;
const replacedFunc = `  const transferFunds = (receiverIdOrPhone: string, amount: number, password?: string) => {`;
code = code.replace(targetFunc, replacedFunc);

code = code.replace(/Object\.values\(users\)\.find\(u => u\.id === receiverIdOrPhone\)/g, `Object.values(users).find((u) => (u as User).id === receiverIdOrPhone)`);
code = code.replace(/receiverPhone/g, 'receiver.phone');

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log("transferFunds fixed");
