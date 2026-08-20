import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, CheckCircle2, Sparkles, TrendingUp, ShieldCheck, ArrowRight, Clock, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RJ_PLANS } from '../data/constants';
import { InvestmentPlan } from '../types';

interface VipTabProps {
  onSelectPlan: (plan: InvestmentPlan) => void;
}

export const VipTab: React.FC<VipTabProps> = ({ onSelectPlan }) => {
  const { currentUser, t, lang, claimDailyIncome } = useApp();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const myVipLevel = currentUser.activePlanIndex >= 0 ? currentUser.activePlanIndex + 1 : 0;
  const today = new Date().toISOString().slice(0, 10);

  // Helper for formatting time remaining
  const formatTimeRemaining = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) return '00:00:00';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-[#14213D] via-[#1B2C52] to-[#0A1128] border border-[#FCA311]/50 p-6 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FCA311]/15 text-[#FCA311] mb-2 shadow-inner">
          <Crown className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-[#FCA311] tracking-wide">
          {t('vipTitle')}
        </h2>
        <p className="text-xs text-[#B0BBD4] mt-1 max-w-md mx-auto">
          {lang === 'bn'
            ? 'সকল VIP প্ল্যান আনলক করা আছে — যেকোনো প্যাকেজে বিনিয়োগ করুন ও ২৪ ঘণ্টা পর দৈনিক মুনাফা গ্রহণ করুন'
            : 'All VIP plans are unlocked — activate any tier & claim daily returns 24 hours after activation'}
        </p>

        <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-[#FCA311]/40 text-xs font-black text-[#FCA311]">
          <span>Current Status: VIP {myVipLevel} • All 15 Tiers Unlocked</span>
        </div>
      </motion.div>

      {/* 15 VIP Tier Cards */}
      <div className="space-y-3">
        {RJ_PLANS.map((plan, index) => {
          const matchingInvestment = currentUser.investments.find(
            (inv) => inv.planId === plan.id && inv.status === 'active'
          );
          const isInvested = !!matchingInvestment;

          const totalReturn = plan.dailyIncome * plan.days;
          const netProfit = totalReturn - plan.investAmount;
          const returnPercentage = Math.round((totalReturn / plan.investAmount) * 100);

          // Calculate 24-hour claim readiness if invested
          let isClaimReady = false;
          let timeString = '00:00:00';
          let isExpired = false;

          if (matchingInvestment) {
            isExpired = matchingInvestment.claimedDays >= matchingInvestment.days;
            const baseTime =
              matchingInvestment.lastClaimedAt ||
              matchingInvestment.activatedAt ||
              (matchingInvestment.startDate ? new Date(matchingInvestment.startDate).getTime() : now);
            const nextClaimTime = matchingInvestment.nextClaimAt || (baseTime + 24 * 60 * 60 * 1000);
            isClaimReady = now >= nextClaimTime;
            timeString = formatTimeRemaining(nextClaimTime);
          }

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl p-4 md:p-5 border transition-all relative overflow-hidden bg-[#14213D] shadow-xl hover:border-[#FCA311]/60"
              style={{
                borderColor: `${plan.accentColor}55`,
                borderLeftWidth: '5px',
                borderLeftColor: plan.accentColor,
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      backgroundColor: `${plan.accentColor}25`,
                      color: plan.accentColor,
                    }}
                  >
                    VIP {plan.vipLevel} • {plan.category}
                  </span>
                  {isInvested && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/40">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-[#B0BBD4]">
                  <span className="flex items-center gap-1 text-[#2ed573]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unlocked & Open</span>
                  </span>
                </div>
              </div>

              {/* Title & Investment Price */}
              <div className="flex items-baseline justify-between mb-3">
                <h3
                  className="text-lg md:text-xl font-black"
                  style={{ color: plan.accentColor }}
                >
                  {plan.name}
                </h3>
                <div className="text-right">
                  <span className="text-xs text-[#B0BBD4] mr-1.5">Invest:</span>
                  <span className="text-lg font-black text-white">
                    ৳{plan.investAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Metric Grid (No Joining Bonus) */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                <div className="bg-black/40 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-[#2ed573]">
                    ৳{plan.dailyIncome.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">{t('dailyIncome')}</div>
                </div>

                <div className="bg-black/40 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-white">{plan.days} d</div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">{t('duration')}</div>
                </div>

                <div className="bg-black/40 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-[#FCA311]">
                    ৳{totalReturn.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">{t('totalReturn')}</div>
                </div>

                <div className="bg-black/40 rounded-xl p-2 text-center">
                  <div className="text-xs font-black text-emerald-400">
                    +৳{netProfit.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">{t('netProfit')} ({returnPercentage}%)</div>
                </div>

                <div className="bg-black/40 rounded-xl p-2 text-center col-span-2 md:col-span-1">
                  <div className="text-xs font-black text-cyan-300">
                    5% • 3% • 2%
                  </div>
                  <div className="text-[9px] text-[#B0BBD4] mt-0.5">3-Gen Referral</div>
                </div>
              </div>

              {/* Action Button */}
              {isInvested ? (
                isExpired ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#B0BBD4] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>{t('expired')}</span>
                  </button>
                ) : isClaimReady ? (
                  <button
                    onClick={() => claimDailyIncome(index)}
                    className="w-full py-3 rounded-xl text-black font-black text-xs md:text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 animate-pulse cursor-pointer hover:brightness-110"
                    style={{
                      background: `linear-gradient(135deg, ${plan.accentColor}, #FCA311)`,
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Claim ৳{plan.dailyIncome} Daily Profit</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-black/50 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#B0BBD4]">
                      <Clock className="w-4 h-4 text-[#FCA311]" />
                      <span>Next Payout in:</span>
                    </div>
                    <span className="font-mono font-black text-sm text-[#FCA311]">
                      {timeString}
                    </span>
                  </div>
                )
              ) : (
                <button
                  onClick={() => onSelectPlan(plan)}
                  className="w-full py-3 rounded-xl text-black font-black text-xs md:text-sm shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 hover:brightness-105 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${plan.accentColor}, #FCA311)`,
                  }}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{t('investBtn')} (৳{plan.investAmount.toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
