const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleSheetsExport.tsx', 'utf8');

code = code.replace(
  "const userArray = Object.values(users);",
  "const userArray = Object.values(users) as any[];"
);

fs.writeFileSync('src/components/GoogleSheetsExport.tsx', code);
console.log("Patched GoogleSheetsExport for TypeScript errors.");
