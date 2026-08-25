import fs from 'fs';
const code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
const endMatch = code.match(/Yes, Delete\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}[\s\S]{0,100}/);
console.log(endMatch[0]);
