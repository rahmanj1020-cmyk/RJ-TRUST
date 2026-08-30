const fs = require('fs');
let content = fs.readFileSync('src/components/InvestTab.tsx', 'utf8');

const searchStr = `<div className="grid grid-cols-3 gap-1.5 text-center text-xs mb-3 bg-black/30 p-2 rounded-xl">
                    <div>
                      <div className="font-black text-[#2ed573]">৳{plan.dailyIncome}</div>
                      <div className="text-[9px] text-[#B0BBD4]">{t('dailyIncome')}</div>
                    </div>
                    <div>
                      <div className="font-black text-white">{plan.days} d</div>
                      <div className="text-[9px] text-[#B0BBD4]">{t('duration')}</div>
                    </div>
                    <div>
                      <div className="font-black text-[#FCA311]">
                        ৳{plan.dailyIncome * plan.days}
                      </div>
                      <div className="text-[9px] text-[#B0BBD4]">{t('totalReturn')}</div>
                    </div>
                  </div>`;

const replacement = `<div className="grid grid-cols-4 gap-1 text-center text-xs mb-3 bg-black/30 p-2 rounded-xl">
                    <div>
                      <div className="font-black text-[#2ed573]">৳{plan.dailyIncome.toLocaleString()}</div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('dailyIncome')}</div>
                    </div>
                    <div>
                      <div className="font-black text-white">{plan.days}d</div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('duration')}</div>
                    </div>
                    <div>
                      <div className="font-black text-[#FCA311]">
                        ৳{(plan.dailyIncome * plan.days).toLocaleString()}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('totalReturn')}</div>
                    </div>
                    <div>
                      <div className="font-black text-emerald-400">
                        ৳{((plan.dailyIncome * plan.days) - plan.investAmount).toLocaleString()}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('netProfit')}</div>
                    </div>
                  </div>`;

if(content.includes(searchStr)) {
  content = content.replace(searchStr, replacement);
  fs.writeFileSync('src/components/InvestTab.tsx', content);
  console.log('Replaced grid in InvestTab.tsx');
} else {
  console.log('Could not find search string in InvestTab.tsx');
}
