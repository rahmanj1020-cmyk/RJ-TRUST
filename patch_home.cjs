const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(/\{inv.claimedDays \* 24\}\/\{inv.days \* 24\} Hours/g, '{inv.claimedDays}/{inv.days} {t(\'daysOf\')}');
code = code.replace(/\{Math.max\(0, inv.days - daysPassed\) \* 24\} h/g, '{Math.max(0, inv.days - daysPassed)} d');
code = code.replace(/>Hours Left</g, '>Days Left<');
code = code.replace(/\{daysPassed \* 24\}\/\{inv.days \* 24\} Hours/g, '{daysPassed}/{inv.days} {t(\'daysOf\')}');

fs.writeFileSync('src/components/HomeTab.tsx', code);
