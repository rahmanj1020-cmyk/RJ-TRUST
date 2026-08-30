const fs = require('fs');
let content = fs.readFileSync('src/components/FDTab.tsx', 'utf8');

// Update logic
content = content.replace('const cycleProfit = monthlyProfit / 6; // per 5 days', 'const cycleProfit = monthlyProfit / 30; // per 1 day');
content = content.replace("const cycleMs = 5 * 24 * 60 * 60 * 1000;", "const cycleMs = 1 * 24 * 60 * 60 * 1000;");

// Update translations
content = content.replace(
  "{lang === 'bn' ? 'প্রতি ৫ দিন পর পর প্রফিট ক্লেইম করা যাবে' : 'Profit can be claimed every 5 days'}",
  "{lang === 'bn' ? 'প্রতিদিন প্রফিট ক্লেইম করা যাবে' : 'Profit can be claimed every 1 day'}"
);
content = content.replace(
  "{lang === 'bn' ? 'প্রতি ৫ দিনের প্রফিট' : 'Profit per 5 days'}",
  "{lang === 'bn' ? 'প্রতিদিনের প্রফিট' : 'Profit per 1 day'}"
);
content = content.replace(
  "{lang === 'bn' ? 'পরবর্তী ক্লেইম ৫ দিন পর' : 'Next claim available after 5 days'}",
  "{lang === 'bn' ? 'পরবর্তী ক্লেইম ১ দিন পর' : 'Next claim available after 1 day'}"
);

fs.writeFileSync('src/components/FDTab.tsx', content);
console.log('Updated FDTab.tsx for daily profit');
