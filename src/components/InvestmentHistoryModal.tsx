import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface InvestmentHistoryModalProps {
  onClose: () => void;
}

export const InvestmentHistoryModal: React.FC<InvestmentHistoryModalProps> = ({ onClose }) => {
  const { currentUser, t, lang } = useApp();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[#2ed573] bg-[#2ed573]/10 border-[#2ed573]/30';
      case 'completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'expired': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const formatTimeRemaining = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) return 'Ready to claim!';
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#14213D] border border-[#2A3A5C] rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2A3A5C] bg-[#0A1128]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Investment History</h3>
              <p className="text-xs text-[#B0BBD4]">Track your active and past plans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {(!currentUser.investments || currentUser.investments.length === 0) ? (
            <div className="text-center py-10 bg-[#0A1128] rounded-2xl border border-dashed border-[#2A3A5C]">
              <Briefcase className="w-10 h-10 text-gray-500 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-gray-400">No investment history found.</p>
              <p className="text-xs text-gray-500 mt-1">Start investing to see your active plans here!</p>
            </div>
          ) : (
            currentUser.investments.map((inv) => {
              const accumulatedProfit = inv.claimedDays * inv.dailyIncome;
              const totalExpectedProfit = inv.days * inv.dailyIncome;
              const progressPercent = Math.min(100, Math.round((inv.claimedDays / inv.days) * 100));
              
              let nextClaimText = 'Completed';
              if (inv.status === 'active') {
                const baseTimestamp = inv.lastClaimedAt || inv.activatedAt || (inv.startDate ? new Date(inv.startDate).getTime() : now);
                const nextClaimTime = inv.nextClaimAt || (baseTimestamp + 24 * 60 * 60 * 1000);
                nextClaimText = formatTimeRemaining(nextClaimTime);
              }

              return (
                <div key={inv.id} className="bg-[#0A1128] border border-[#2A3A5C] rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-base font-black text-white">{inv.planName}</h4>
                      <p className="text-xs text-[#B0BBD4] mt-0.5">Started: {new Date(inv.startDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#B0BBD4] uppercase mb-1">Invested Amount</p>
                      <p className="text-sm font-black text-white">৳{inv.investAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#B0BBD4] uppercase mb-1">Accumulated Profit</p>
                      <p className="text-sm font-black text-[#2ed573]">৳{accumulatedProfit.toLocaleString()} <span className="text-xs font-normal text-gray-500">/ ৳{totalExpectedProfit.toLocaleString()}</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#B0BBD4] uppercase mb-1">Daily Return</p>
                      <p className="text-sm font-black text-[#FCA311]">৳{inv.dailyIncome.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#B0BBD4] uppercase mb-1">Maturity Progress</p>
                      <p className="text-sm font-black text-white">{inv.claimedDays} <span className="text-xs font-normal text-gray-500">/ {inv.days} Days</span></p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-[#14213D] rounded-full h-1.5 border border-[#2A3A5C] overflow-hidden">
                      <div 
                        className="bg-[#2ed573] h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Claim Timer */}
                  {inv.status === 'active' && (
                    <div className="flex items-center gap-2 bg-[#14213D] border border-[#2A3A5C] p-3 rounded-xl">
                      <Clock className="w-4 h-4 text-[#FCA311]" />
                      <div className="flex-1">
                        <p className="text-[10px] text-[#B0BBD4] font-semibold">Next Profit Claim In:</p>
                        <p className="text-xs font-bold text-white font-mono">{nextClaimText}</p>
                      </div>
                      {nextClaimText === 'Ready to claim!' && (
                        <div className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
                      )}
                    </div>
                  )}
                  {inv.status === 'completed' && (
                    <div className="flex items-center gap-2 bg-[#14213D] border border-[#2A3A5C] p-3 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-blue-400 font-bold">Plan successfully completed.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
