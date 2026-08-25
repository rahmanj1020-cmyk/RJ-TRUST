const fs = require('fs');
let code = fs.readFileSync('src/data/constants.ts', 'utf8');

code = code.replace(/days: \d+,/g, 'days: 30,');

fs.writeFileSync('src/data/constants.ts', code);
console.log("Patched days limit to 30.");
