import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, CheckCircle2, Calendar, TrendingUp, AlertCircle, Sparkles, Clock, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FDTab: React.FC = () => {
  const { currentUser, lang, createFD, claimFDProfit, transactions } = useApp();
  const [amount, setAmount] = useState<string>('');
  const [activeSegment, setActiveSegment] = useState<'create' | 'fds' | 'tx'>('create');

  if (!currentUser) return null;

  const handleCreateFD = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num)) return;
    createFD(num);
    setAmount('');
  };

  const calculateExample = () => {
    const num = parseFloat(amount) || 1500;
    const monthlyProfit = (num * 7.5) / 100;
    const cycleProfit = monthlyProfit / 30; // per 1 day
    const totalProfit = monthlyProfit * 6; // 6 months
    return { monthlyProfit, cycleProfit, totalProfit, totalReturn: num + totalProfit };
  };

  const { monthlyProfit, cycleProfit, totalProfit, totalReturn } = calculateExample();
  const minDeposit = 1500;
  
  const fds = currentUser.fds || [];
  const totalFDBalance = fds.reduce((sum, fd) => fd.status === 'active' ? sum + fd.principal : sum, 0);
  const totalMonthlySummary = (totalFDBalance * 7.5) / 100;

  return (
    <div className="pb-24 pt-6 px-4 md:px-8 max-w-lg mx-auto md:max-w-4xl space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <Landmark className="w-7 h-7 text-[#FCA311]" />
          Fixed Deposit
        </h1>
        <p className="text-sm text-[#B0BBD4]">
          {lang === 'bn' ? 'নিশ্চিত মুনাফা, সুরক্ষিত ভবিষ্যৎ' : 'Secure Returns, Guaranteed Future'}
        </p>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#14213D] via-[#1B2C52] to-[#0A1128] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Landmark className="w-24 h-24" />
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#B0BBD4] font-medium mb-1">
              {lang === 'bn' ? 'মোট এফডি ব্যালেন্স' : 'Total FD Balance'}
            </p>
            <p className="text-2xl font-black text-white">৳{totalFDBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#B0BBD4] font-medium mb-1">
              {lang === 'bn' ? 'মাসিক সম্ভাব্য প্রফিট' : 'Expected Monthly Profit'}
            </p>
            <p className="text-2xl font-black text-[#FCA311]">৳{totalMonthlySummary.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-[#14213D] p-1 rounded-2xl border border-[#2A3A5C]">
        <button
          onClick={() => setActiveSegment('create')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeSegment === 'create'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-[#FCA311]/20'
              : 'text-[#B0BBD4] hover:text-white'
          }`}
        >
          {lang === 'bn' ? 'নতুন এফডি' : 'Create FD'}
        </button>
        <button
          onClick={() => setActiveSegment('fds')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeSegment === 'fds'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-[#FCA311]/20'
              : 'text-[#B0BBD4] hover:text-white'
          }`}
        >
          {lang === 'bn' ? 'আমার এফডি সমূহ' : 'My FDs'}
        </button>
        <button
          onClick={() => setActiveSegment('tx')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeSegment === 'tx'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-[#FCA311]/20'
              : 'text-[#B0BBD4] hover:text-white'
          }`}
        >
          {lang === 'bn' ? 'লেনদেন' : 'History'}
        </button>
      </div>

      {activeSegment === 'create' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-5"
        >
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 sm:p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? 'এফডি পলিসি (৬ মাস)' : 'FD Policy (6 Months)'}
            </h3>
            <ul className="space-y-3 text-xs text-[#B0BBD4]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'bn' ? 'মাসিক মুনাফা: ৭.৫%' : 'Monthly Profit: 7.5%'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'bn' ? 'সর্বনিম্ন ডিপোজিট: ১৫০০ ৳' : 'Minimum Deposit: 1500 ৳ (No Maximum)'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'bn' ? 'প্রতিদিন প্রফিট ক্লেইম করা যাবে' : 'Profit can be claimed every 1 day'}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{lang === 'bn' ? '৬ মাস পর মূল টাকা ফেরত যোগ্য' : 'Principal fully returned after 6-month maturity'}</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleCreateFD} className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-2">
                {lang === 'bn' ? 'ডিপোজিট পরিমাণ (৳)' : 'Deposit Amount (৳)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-[#FCA311] font-bold">৳</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-2xl py-3 pl-8 pr-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#FCA311] transition-all"
                  min={minDeposit}
                  required
                />
              </div>
            </div>

            <div className="bg-[#0A1128] border border-[#2A3A5C] rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'bn' ? '৬ মাসের সম্ভাব্য হিসাব' : '6-Month Projection'}
              </h4>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{lang === 'bn' ? 'প্রতিদিনের প্রফিট' : 'Profit per 1 day'}</span>
                <span className="font-bold text-emerald-400">+৳{cycleProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{lang === 'bn' ? 'মাসিক প্রফিট' : 'Monthly Profit'}</span>
                <span className="font-bold text-emerald-400">+৳{monthlyProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-[#2A3A5C] pt-2">
                <span className="text-slate-400">{lang === 'bn' ? '৬ মাস পর মোট রিটার্ন' : 'Total Return (6 Months)'}</span>
                <span className="font-black text-[#FCA311]">৳{totalReturn.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={parseFloat(amount) < minDeposit || currentUser.balance < parseFloat(amount)}
              className="w-full py-3.5 rounded-2xl font-black text-black text-sm uppercase tracking-wide transition-all bg-[#FCA311] hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FCA311]"
            >
              {lang === 'bn' ? 'ফিক্সড ডিপোজিট শুরু করুন' : 'Start Fixed Deposit'}
            </button>
            <p className="text-center text-[10px] text-slate-500">
              {lang === 'bn' ? `আপনার মূল ব্যালেন্স: ৳${currentUser.balance}` : `Your Available Balance: ৳${currentUser.balance}`}
            </p>
          </form>
        </motion.div>
      )}

      {activeSegment === 'fds' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {fds.length === 0 ? (
            <div className="text-center py-12 bg-[#14213D] border border-[#2A3A5C] rounded-3xl">
              <FileText className="w-12 h-12 text-[#2A3A5C] mx-auto mb-3" />
              <p className="text-[#B0BBD4] text-sm">
                {lang === 'bn' ? 'কোনো এফডি পাওয়া যায়নি' : 'No Fixed Deposits found'}
              </p>
            </div>
          ) : (
            fds.slice().reverse().map((fd) => {
              const now = Date.now();
              const totalDuration = fd.maturityAt - fd.activatedAt;
              const elapsed = now - fd.activatedAt;
              const progress = Math.min((elapsed / totalDuration) * 100, 100);
              
              const cycleMs = 1 * 24 * 60 * 60 * 1000;
              const timeSinceLastClaim = now - (fd.lastClaimedAt || fd.activatedAt);
              const canClaim = timeSinceLastClaim >= cycleMs && fd.status === 'active';
              
              return (
                <div key={fd.id} className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 relative overflow-hidden shadow-xl">
                  {fd.status === 'matured' && (
                    <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-emerald-500/30">
                      Matured
                    </div>
                  )}
                  {fd.status === 'active' && (
                    <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/30">
                      Active
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-500 font-mono mb-1">ID: {fd.id}</p>
                    <h3 className="text-lg font-black text-white">৳{fd.principal.toLocaleString()}</h3>
                    <p className="text-xs text-[#B0BBD4]">
                      {fd.startDate} <span className="mx-2 opacity-50">→</span> {fd.maturityDate}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span className="text-slate-400">Maturity Progress</span>
                      <span className="text-emerald-400">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#0A1128] rounded-full overflow-hidden border border-[#2A3A5C]/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-[#0A1128] p-3 rounded-2xl border border-[#2A3A5C]">
                    <div>
                      <p className="text-[10px] text-slate-500">{lang === 'bn' ? 'সর্বমোট ক্লেইম' : 'Total Claimed'}</p>
                      <p className="text-sm font-black text-[#FCA311]">৳{fd.totalClaimed.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => claimFDProfit(fd.id)}
                      disabled={!canClaim}
                      className="px-4 py-2 rounded-xl text-xs font-black transition-all bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                    >
                      {lang === 'bn' ? 'প্রফিট ক্লেইম' : 'Claim Profit'}
                    </button>
                  </div>
                  
                  {!canClaim && fd.status === 'active' && (
                    <p className="text-[10px] text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lang === 'bn' ? 'পরবর্তী ক্লেইম ১ দিন পর' : 'Next claim available after 1 day'}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {activeSegment === 'tx' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {(() => {
            const fdTxs = transactions.filter(tx => tx.userId === currentUser.phone && (tx.type === 'fd_deposit' || tx.type === 'fd_profit'));
            if (fdTxs.length === 0) {
              return (
                <div className="text-center py-12 bg-[#14213D] border border-[#2A3A5C] rounded-3xl">
                  <FileText className="w-12 h-12 text-[#2A3A5C] mx-auto mb-3" />
                  <p className="text-[#B0BBD4] text-sm">
                    {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No transactions found'}
                  </p>
                </div>
              );
            }
            return fdTxs.map((tx) => (
              <div key={tx.id} className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-4 shadow-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{lang === 'bn' ? tx.titleBn : tx.title}</h4>
                  <p className="text-[10px] text-slate-500">{tx.date} • {tx.details}</p>
                </div>
                <div className={`text-lg font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}৳{Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ));
          })()}
        </motion.div>
      )}
    </div>
  );
};
