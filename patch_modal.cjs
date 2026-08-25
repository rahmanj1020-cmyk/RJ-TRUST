const fs = require('fs');
let code = fs.readFileSync('src/components/PlanDetailsModal.tsx', 'utf8');

code = code.replace(/\{\/\* Maturity Payout Badge \*\/\}.*?<\/div>\s*<\/div>/s, `<div className="text-xs text-amber-300 font-bold mt-1.5 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FCA311]" />
              <span>Daily Payout: 24h After Activation</span>
            </div>`);

code = code.replace(/<span className="font-extrabold text-amber-300">At Maturity \(\{plan\.days \* 24\}h\)<\/span>/, `<span className="font-extrabold text-amber-300">Every 24 Hours</span>`);

code = code.replace(/<span className="font-extrabold text-white">\{plan\.days \* 24\} Hours<\/span>/, `<span className="font-extrabold text-white">{plan.days} Days</span>`);

fs.writeFileSync('src/components/PlanDetailsModal.tsx', code);
