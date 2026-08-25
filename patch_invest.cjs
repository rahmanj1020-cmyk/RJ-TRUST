const fs = require('fs');
let code = fs.readFileSync('src/components/InvestTab.tsx', 'utf8');

// Remove Payout Frequency bar
code = code.replace(
`                  <div className="mb-2 px-2 py-1.5 bg-black/30 rounded-lg border border-white/5 flex justify-between items-center">\n                    <span className="text-[9px] font-bold text-[#B0BBD4]">Payout Frequency</span>\n                    <span className="text-[10px] font-black text-[#FCA311]">Every 24 Hours</span>\n                  </div>\n`, ''
);

// Restore plan.days * 24 h back to plan.days d
code = code.replace(/\{plan\.days \* 24\} h/g, '{plan.days} d');

fs.writeFileSync('src/components/InvestTab.tsx', code);
