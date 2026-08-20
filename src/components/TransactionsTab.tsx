import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ReceiptText, ArrowDownLeft, ArrowUpRight, Search, Filter, CheckCircle2, Clock, XCircle, Sparkles, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

export const TransactionsTab: React.FC = () => {
  const { transactions, currentUser, lang, t } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!currentUser) return null;

  // Filter user transactions
  const userTxs = transactions.filter((tx) => tx.userId === currentUser.phone);

  const filteredTxs = userTxs.filter((tx) => {
    // Type filtering
    if (filterType !== 'all') {
      if (filterType === 'deposit' && tx.type !== 'deposit') return false;
      if (filterType === 'withdrawal' && tx.type !== 'withdrawal') return false;
      if (filterType === 'income' && tx.type !== 'daily_income' && tx.type !== 'bonus') return false;
      if (filterType === 'referral' && tx.type !== 'referral_commission') return false;
      if (filterType === 'bond' && tx.type !== 'bond_purchase' && tx.type !== 'bond_prize' && tx.type !== 'bond_refund') return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const titleMatch = (tx.title || '').toLowerCase().includes(q) || (tx.titleBn || '').toLowerCase().includes(q);
      const trxMatch = (tx.trxId || '').toLowerCase().includes(q);
      const detailsMatch = (tx.details || '').toLowerCase().includes(q);
      return titleMatch || trxMatch || detailsMatch;
    }

    return true;
  });

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdrawal', label: 'Withdrawals' },
    { id: 'income', label: 'Income & Claims' },
    { id: 'referral', label: 'Referrals' },
    { id: 'bond', label: 'Price Bonds' },
  ];

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-[#FCA311]" />
          <span>{t('txTitle')}</span>
        </h2>
        <span className="text-xs text-[#B0BBD4] font-medium">
          {filteredTxs.length} records
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, TrxID, details..."
          className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311] transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-[#FCA311] text-black shadow-md shadow-amber-500/20'
                : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTxs.length > 0 ? (
          filteredTxs.map((tx) => {
            const isPositive = tx.amount > 0;
            const statusColor =
              tx.status === 'approved' || tx.status === 'completed'
                ? 'text-[#2ed573] bg-[#2ed573]/10 border-[#2ed573]/30'
                : tx.status === 'pending'
                ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                : 'text-red-400 bg-red-400/10 border-red-400/30';

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isPositive
                        ? 'bg-[#2ed573]/15 text-[#2ed573]'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-white">
                      {lang === 'bn' ? tx.titleBn || tx.title : tx.title}
                    </h4>
                    <div className="text-[11px] text-[#B0BBD4] flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>{tx.date}</span>
                      {tx.trxId && (
                        <span className="font-mono text-amber-300">TrxID: {tx.trxId}</span>
                      )}
                      {tx.details && (
                        <span className="text-gray-400">({tx.details})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-sm md:text-base font-black ${isPositive ? 'text-[#2ed573]' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}৳{Math.abs(tx.amount).toLocaleString()}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 capitalize ${statusColor}`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-8 text-center text-[#B0BBD4] text-xs">
            {t('noTx')}
          </div>
        )}
      </div>
    </div>
  );
};
