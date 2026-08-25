const fs = require('fs');
let investCode = fs.readFileSync('src/components/InvestTab.tsx', 'utf8');
investCode = investCode.replace(/Every \{plan.days \* 24\} Hours/g, 'Every 24 Hours');
fs.writeFileSync('src/components/InvestTab.tsx', investCode);

let vipCode = fs.readFileSync('src/components/VipTab.tsx', 'utf8');
vipCode = vipCode.replace(/Every \{plan.days \* 24\} Hours/g, 'Every 24 Hours');
fs.writeFileSync('src/components/VipTab.tsx', vipCode);
