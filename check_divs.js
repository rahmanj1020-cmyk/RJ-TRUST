import fs from 'fs';
const code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
const openDivs = (code.match(/<div[^>]*>/g) || []).length;
const closeDivs = (code.match(/<\/div>/g) || []).length;
console.log('Open:', openDivs, 'Close:', closeDivs);
