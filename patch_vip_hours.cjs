const fs = require('fs');
let code = fs.readFileSync('src/components/VipTab.tsx', 'utf8');

// Replace "{plan.days} d" with "{plan.days * 24} Hours"
code = code.replace(/\{plan\.days\} d/g, '{plan.days * 24} Hours');

// Replace "dailyIncome" translation with "Payout Frequency" in English/Bengali if we need to? 
// No, let's just add a badge or text for "Payout Frequency: Every {plan.days * 24} Hours"

fs.writeFileSync('src/components/VipTab.tsx', code);
