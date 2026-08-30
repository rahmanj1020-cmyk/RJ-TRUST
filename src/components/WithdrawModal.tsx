import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Briefcase } from 'lucide-react';
import { PAYMENT_METHODS } from '../data/constants';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, submitWithdrawal, t, lang, showToast, marketingTeam } = useApp();
  const isMarketingMember = currentUser?.isMarketingTeam || marketingTeam.some(m => m.phone === currentUser?.phone);

  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [amount, setAmount] = useState<string>('500');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const numAmount = parseFloat(amount) || 0;
  const fee = Math.ceil(numAmount * 0.05);
  const netAmount = Math.max(0, numAmount - fee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount < 500) {
      showToast(lang === 'bn' ? 'সর্বনিম্ন ৫০০ টাকা উত্তোলন করা যাবে' : 'Minimum withdrawal is ৳500', 'error');
      return;
    }
    if (numAmount > 25000) {
      showToast(lang === 'bn' ? 'সর্বোচ্চ ২৫,০০০ টাকা উত্তোলন করা যাবে' : 'Maximum withdrawal is ৳25,000', 'error');
      return;
    }
    if (currentUser.balance < numAmount) {
      showToast(lang === 'bn' ? 'অপর্যাপ্ত ব্যালেন্স' : 'Insufficient balance', 'error');
      return;
    }
    if (!accountNumber || accountNumber.trim().length < 11) {
      showToast(lang === 'bn' ? 'সঠিক ১১ ডিজিটের অ্যাকাউন্ট নম্বর দিন' : 'Enter valid 11-digit wallet number', 'error');
      return;
    }

    // Security PIN Check if configured
    if (currentUser.securityPin && currentUser.isPinEnabled) {
      if (!pinInput || pinInput.trim() !== currentUser.securityPin) {
        showToast(lang === 'bn' ? 'ভুল ৪-ডিজিট সিকিউরিটি পিন' : 'Invalid 4-digit Security PIN', 'error');
        return;
      }
    }

    setLoading(true);
    const res = submitWithdrawal(numAmount, selectedMethod, accountNumber);
    setLoading(false);

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
          className="bg-[#14213D] border-t sm:border border-[#2A3A5C] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2ed573]/15 text-[#2ed573] flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {t('withdraw')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#B0BBD4] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Available Balance */}
          <div className="my-3 p-3 rounded-2xl bg-black/40 border border-white/10 flex justify-between items-center text-xs">
            <span className="text-[#B0BBD4]">Available Balance:</span>
            <span className="font-black text-[#2ed573] text-sm">
              ৳{currentUser.balance.toLocaleString()}
            </span>
          </div>

          <p className="text-xs text-[#B0BBD4] mb-3">
            {t('minWithdraw')} • {t('withdrawFee')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                Withdrawal Amount (৳)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500 - 25000"
                min="500"
                max="25000"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            {/* Method Select */}
            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                {t('paymentMethod')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                      selectedMethod === m.id
                        ? 'border-[#FCA311] bg-black text-[#FCA311]'
                        : 'border-[#2A3A5C] bg-[#0A1128] text-[#B0BBD4]'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                {t('accountNumber')}
              </label>
              <input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            {currentUser.securityPin && currentUser.isPinEnabled && (
              <div>
                <label className="block text-xs font-bold text-[#FCA311] mb-1 flex items-center justify-between">
                  <span>{lang === 'bn' ? '৪ ডিজিট সিকিউরিটি পিন' : '4-Digit Security PIN'}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">PIN Protected</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-[#0A1128] border border-amber-500/50 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-[#FCA311] focus:outline-none focus:border-[#FCA311]"
                  required
                />
              </div>
            )}

            {/* Fee & Net Calculation Breakdown */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#B0BBD4]">
                <span>Requested Amount:</span>
                <span className="font-bold text-white">৳{numAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#B0BBD4]">
                <span>Network Charge (5%):</span>
                <span className="font-bold text-red-400">-৳{fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white font-extrabold pt-1.5 border-t border-white/10">
                <span>Net You Will Receive:</span>
                <span className="font-black text-[#2ed573] text-sm">৳{netAmount.toLocaleString()}</span>
              </div>
            </div>

            {isMarketingMember ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || currentUser.balance < numAmount || numAmount < 500}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-500 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all hover:brightness-105 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Briefcase className="w-4 h-4" />
                {loading ? 'Submitting...' : 'Marketing Team Withdraw'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || currentUser.balance < numAmount || numAmount < 500}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all hover:brightness-105 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
              </button>
            )}
            </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
