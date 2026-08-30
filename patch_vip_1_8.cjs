const fs = require('fs');
let content = fs.readFileSync('src/data/constants.ts', 'utf8');

const updated = content.replace(/id:\s*(\d+),([\s\S]*?)investAmount:\s*(\d+),\s*dailyIncome:\s*(\d+),/g, (match, idStr, middle, investStr, dailyStr) => {
  const id = parseInt(idStr, 10);
  const invest = parseInt(investStr, 10);
  let newDaily = parseInt(dailyStr, 10);
  
  if (id >= 1 && id <= 8) {
    newDaily = Math.round(invest * 0.10); // 10%
  }
  
  return `id: ${id},${middle}investAmount: ${invest},\n    dailyIncome: ${newDaily},`;
});

fs.writeFileSync('src/data/constants.ts', updated);
console.log('Updated VIP 1-8 daily incomes to 10%');
