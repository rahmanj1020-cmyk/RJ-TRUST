const fs = require('fs');
const content = fs.readFileSync('src/data/constants.ts', 'utf8');

const updated = content.replace(/investAmount:\s*(\d+),\s*dailyIncome:\s*(\d+),/g, (match, investStr, dailyStr) => {
  const invest = parseInt(investStr, 10);
  const newDaily = Math.round(invest * 0.08); // 8%
  return `investAmount: ${invest},\n    dailyIncome: ${newDaily},`;
});

fs.writeFileSync('src/data/constants.ts', updated);
console.log('Updated constants.ts');
