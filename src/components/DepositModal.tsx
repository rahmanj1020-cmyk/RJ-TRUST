import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, ArrowDownLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PAYMENT_METHODS } from '../data/constants';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { submitDeposit, t, lang, showToast } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [amount, setAmount] = useState<string>('500');
  const [trxId, setTrxId] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentMethodConfig = PAYMENT_METHODS.find((m) => m.id === selectedMethod) || PAYMENT_METHODS[0];

  const handleCopyNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentMethodConfig.number);
      setCopiedNumber(true);
      showToast(lang === 'bn' ? 'নম্বর কপি হয়েছে' : 'Number copied to clipboard', 'success');
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      showToast(lang === 'bn' ? 'সর্বনিম্ন ১০০ টাকা ডিপোজিট করুন' : 'Minimum deposit is ৳100', 'error');
      return;
    }
    if (!trxId.trim()) {
      showToast(lang === 'bn' ? 'সঠিক Transaction ID দিন' : 'Enter valid Transaction ID', 'error');
      return;
    }

    setLoading(true);
    const res = submitDeposit(numAmount, selectedMethod, trxId);
    setLoading(false);

    if (res.success) {
      setTrxId('');
      onClose();
    } else {
      showToast(res.message, 'error');
    }
  };

  const quickAmounts = [300, 500, 1000, 2500, 5000, 10000];

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
              <div className="w-8 h-8 rounded-xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {t('deposit')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#B0BBD4] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-[#B0BBD4] my-2">
            {t('minDeposit')} — Send Money to our official payment numbers below, then submit TrxID.
          </p>

          {/* Payment Methods Selector */}
          <div className="grid grid-cols-3 gap-2 my-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                  selectedMethod === m.id
                    ? 'border-[#FCA311] bg-black/50 shadow-lg shadow-amber-500/15 ring-1 ring-[#FCA311]'
                    : 'border-[#2A3A5C] bg-[#0A1128] hover:bg-white/5 opacity-80'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="font-extrabold text-xs text-white">{m.name}</span>
                <span className="text-[9px] text-[#B0BBD4]">{m.type}</span>
              </button>
            ))}
          </div>

          {/* Official Merchant Number Box */}
          <div className="rounded-2xl bg-black/60 border border-[#FCA311]/40 p-3.5 mb-4">
            <div className="flex items-center justify-between text-[11px] text-[#B0BBD4] mb-1">
              <span>{currentMethodConfig.name} ({currentMethodConfig.type}) Number:</span>
              <span className="text-[#2ed573] font-bold">24/7 Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-lg md:text-xl tracking-wider text-[#FCA311] font-mono">
                {currentMethodConfig.number}
              </span>
              <button
                onClick={handleCopyNumber}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1 active:scale-95 transition-all"
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5 text-[#2ed573]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                Deposit Amount (৳)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min ৳100"
                min="100"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#FCA311]"
              />

              {/* Quick Preset Amount Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-[#FCA311] whitespace-nowrap"
                  >
                    +৳{q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                {t('trxId')}
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="e.g. 9J28A74K9"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-sm font-mono text-white uppercase placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all hover:brightness-105 mt-2"
            >
              {loading ? 'Submitting...' : 'Submit Deposit Request'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
