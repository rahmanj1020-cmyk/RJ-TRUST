const fs = require('fs');
let code = fs.readFileSync('src/components/InvestTab.tsx', 'utf8');

const target = `<div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3 bg-black/30 p-2 rounded-xl">`;
const replacement = `<div className="mb-2 px-2 py-1.5 bg-black/30 rounded-lg border border-white/5 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-[#B0BBD4]">Payout Frequency</span>
                    <span className="text-[10px] font-black text-[#FCA311]">Every {plan.days * 24} Hours</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3 bg-black/30 p-2 rounded-xl">`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/InvestTab.tsx', code);
