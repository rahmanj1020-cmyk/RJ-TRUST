const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Replace balance
code = code.replace(
  "currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })",
  "currentUser.balance === 0 ? '000' : currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
);

// Replace commission
code = code.replace(
  "currentUser.commission.toLocaleString()",
  "currentUser.commission === 0 ? '000' : currentUser.commission.toLocaleString()"
);

// Replace investAmount
code = code.replace(
  "inv.investAmount.toLocaleString()",
  "inv.investAmount === 0 ? '000' : inv.investAmount.toLocaleString()"
);

// Replace dailyIncome
code = code.replace(
  "inv.dailyIncome.toLocaleString()",
  "inv.dailyIncome === 0 ? '000' : inv.dailyIncome.toLocaleString()"
);

// Replace totalEarnedSoFar
code = code.replace(
  "totalEarnedSoFar.toLocaleString()",
  "totalEarnedSoFar === 0 ? '000' : totalEarnedSoFar.toLocaleString()"
);

// Replace tx.amount
code = code.replace(
  "Math.abs(tx.amount).toLocaleString()",
  "Math.abs(tx.amount) === 0 ? '000' : Math.abs(tx.amount).toLocaleString()"
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
console.log("HomeTab amounts formatted to 000!");
