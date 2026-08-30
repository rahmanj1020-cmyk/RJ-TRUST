const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace(/const fiveDaysMs = 5 \* 24 \* 60 \* 60 \* 1000;/g, 'const oneDayMs = 1 * 24 * 60 * 60 * 1000;');
content = content.replace(/if \(elapsed < fiveDaysMs\) \{/g, 'if (elapsed < oneDayMs) {');
content = content.replace(/'এখনও ৫ দিন পূর্ণ হয়নি' : '5 days have not passed yet'/g, "'এখনও ১ দিন পূর্ণ হয়নি' : '1 day has not passed yet'");
content = content.replace(/Math.floor\(elapsed \/ fiveDaysMs\)/g, 'Math.floor(elapsed / oneDayMs)');
content = content.replace(/profitPerCycle = \(fd.principal \* 7.5 \/ 100\) \/ 6;/g, 'profitPerCycle = (fd.principal * 7.5 / 100) / 30;');
content = content.replace(/\(cycles \* fiveDaysMs\)/g, '(cycles * oneDayMs)');

fs.writeFileSync('src/context/AppContext.tsx', content);
console.log('Updated AppContext.tsx for FD');
