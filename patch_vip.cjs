const fs = require('fs');
let code = fs.readFileSync('src/components/VipTab.tsx', 'utf8');

// Remove Payout Frequency bar
code = code.replace(
`<div className="mb-3 px-3 py-2 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#B0BBD4]">Payout Frequency</span>
                <span className="text-[11px] font-black text-[#FCA311]">Every 24 Hours</span>
              </div>`, ''
);

// Restore plan.days * 24 h back to plan.days d
code = code.replace(/\{plan\.days \* 24\} h/g, '{plan.days} d');

fs.writeFileSync('src/components/VipTab.tsx', code);
