const fs = require('fs');
let code = fs.readFileSync('src/components/VipTab.tsx', 'utf8');

const target = `<div className="text-xs font-black text-white">{plan.days * 24} Hours</div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">{t('duration')}</div>
                </div>`;

const replacement = `<div className="text-xs font-black text-white">{plan.days * 24} h</div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">{t('duration')}</div>
                </div>`;
code = code.replace(target, replacement);

const metricGrid = `<div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">`;
const metricGridReplacement = `<div className="mb-3 px-3 py-2 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#B0BBD4]">Payout Frequency</span>
                <span className="text-[11px] font-black text-[#FCA311]">Every {plan.days * 24} Hours</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">`;

code = code.replace(metricGrid, metricGridReplacement);
fs.writeFileSync('src/components/VipTab.tsx', code);
