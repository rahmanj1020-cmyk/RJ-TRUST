const fs = require('fs');
let code = fs.readFileSync('src/data/constants.ts', 'utf8');
code = code.replace(/dailyIncome:\s*5600/g, 'dailyIncome: 7000');
code = code.replace(/dailyIncome:\s*'দৈনিক পেআউট'/g, "dailyIncome: 'দৈনিক আয়'");
code = code.replace(/dailyIncome:\s*'Daily Payout'/g, "dailyIncome: 'Daily Income'");
fs.writeFileSync('src/data/constants.ts', code);
