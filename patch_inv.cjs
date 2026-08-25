const fs = require('fs');
let code = fs.readFileSync('src/components/InvestmentHistoryModal.tsx', 'utf8');

code = code.replace(/\{inv.claimedDays \* 24\} <span className="text-xs font-normal text-gray-500">\/ \{inv.days \* 24\} Hours<\/span>/g, '{inv.claimedDays} <span className="text-xs font-normal text-gray-500">/ {inv.days} Days</span>');

fs.writeFileSync('src/components/InvestmentHistoryModal.tsx', code);
