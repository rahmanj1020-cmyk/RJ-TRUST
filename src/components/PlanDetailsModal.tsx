import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, TrendingUp, Sparkles, ShieldCheck, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InvestmentPlan } from '../types';

interface PlanDetailsModalProps {
  plan: InvestmentPlan | null;
  onClose: () => void;
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ plan, onClose }) => {
  const { currentUser, investInPlan, t, lang, showToast } = useApp();

  if (!plan || !currentUser) return null;

  const totalReturn = plan.dailyIncome * plan.days;
  const netProfit = totalReturn - plan.investAmount;
  const returnPercentage = Math.round((totalReturn / plan.investAmount) * 100);
  const hasEnoughBalance = currentUser.balance >= plan.investAmount;

  const handleConfirm = () => {
    const res = investInPlan(plan.id);
    if (res.success) {
      onClose();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-[#14213D] border-t sm:border border-[#2A3A5C] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-xl text-xs font-black text-black"
                style={{ backgroundColor: plan.accentColor }}
              >
                VIP {plan.vipLevel}
              </span>
              <h3 className="font-extrabold text-base text-white">{plan.name}</h3>
            </div>
            <button onClick={onClose} className="p-1 text-[#B0BBD4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Investment Price Spotlight */}
          <div className="my-4 p-4 rounded-2xl bg-black/60 border border-white/10 text-center">
            <div className="text-xs text-[#B0BBD4] uppercase tracking-wider font-bold">
              Required Capital
            </div>
            <div className="text-3xl font-black text-white mt-1">
              <span className="text-[#FCA311]">৳</span>
              <span>{plan.investAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-amber-300 font-bold mt-1.5 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FCA311]" />
              <span>Daily Payout: 24h After Activation</span>
            </div>
          </div>

          {/* Parameter Table */}
          <div className="space-y-2 text-xs divide-y divide-white/5 bg-black/30 p-3 rounded-2xl border border-white/5 mb-4">
            <div className="flex justify-between py-1.5 text-[#B0BBD4]">
              <span>{t('dailyIncome')}:</span>
              <span className="font-extrabold text-[#2ed573]">৳{plan.dailyIncome.toLocaleString()} / day</span>
            </div>
            <div className="flex justify-between py-1.5 text-[#B0BBD4]">
              <span>{t('duration')}:</span>
              <span className="font-extrabold text-white">{plan.days} Days</span>
            </div>
            <div className="flex justify-between py-1.5 text-[#B0BBD4]">
              <span>{t('totalReturn')}:</span>
              <span className="font-extrabold text-[#FCA311]">৳{totalReturn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 text-[#B0BBD4]">
              <span>{t('netProfit')}:</span>
              <span className="font-extrabold text-emerald-400">+৳{netProfit.toLocaleString()} ({returnPercentage}%)</span>
            </div>
            <div className="flex justify-between py-1.5 text-[#B0BBD4]">
              <span>Payout Frequency:</span>
              <span className="font-extrabold text-amber-300">Every 24 Hours</span>
            </div>
            <div className="flex justify-between py-1.5 text-[#B0BBD4]">
              <span>Referral Commission:</span>
              <span className="font-extrabold text-cyan-300">5% • 3% • 2% (3 Tiers)</span>
            </div>
          </div>

          {/* Wallet check */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center text-xs mb-4">
            <span className="text-[#B0BBD4]">Your Wallet Balance:</span>
            <span className={`font-black ${hasEnoughBalance ? 'text-[#2ed573]' : 'text-red-400'}`}>
              ৳{currentUser.balance.toLocaleString()}
            </span>
          </div>

          {!hasEnoughBalance && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>Insufficient balance. Please deposit first to activate this VIP tier.</span>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!hasEnoughBalance}
            className="w-full py-3.5 rounded-xl font-extrabold text-sm text-black shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${plan.accentColor}, #FCA311)`,
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Confirm & Activate Package</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
