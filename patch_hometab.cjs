const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(/\{inv.claimedDays\}\/\{inv.days\} \{t\('daysOf'\)\}/g, '{inv.claimedDays * 24}/{inv.days * 24} Hours');
code = code.replace(/\{Math.max\(0, inv.days - daysPassed\)\} d/g, '{Math.max(0, inv.days - daysPassed) * 24} h');
code = code.replace(/>Days Left</g, '>Hours Left<');
code = code.replace(/\{daysPassed\}\/\{inv.days\} \{t\('daysOf'\)\}/g, '{daysPassed * 24}/{inv.days * 24} Hours');

fs.writeFileSync('src/components/HomeTab.tsx', code);
