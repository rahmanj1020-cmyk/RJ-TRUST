import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Users,
  Gift,
  TrendingUp,
  Copy,
  Check,
  UserPlus,
  Share2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGenerationStats, parseTxGeneration } from '../utils/useGenerationStats';

interface ReferralsModalProps {
  onClose: () => void;
}

export const ReferralsModal: React.FC<ReferralsModalProps> = ({ onClose }) => {
  const { currentUser, users, transactions, lang, showToast } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [period, setPeriod] = useState<'30days' | 'all'>('30days');
  const [activeGenTab, setActiveGenTab] = useState<1 | 2 | 3>(1);
  const [viewTab, setViewTab] = useState<'members' | 'history'>('members');

  const stats = useGenerationStats(currentUser, users, transactions);

  if (!currentUser) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rjtrust.app';
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referralUrl = `${currentOrigin}${currentPathname}?ref=${currentUser.referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopiedCode(true);
    showToast(lang === 'bn' ? 'রেফারেল কোড কপি করা হয়েছে!' : 'Referral code copied!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast(lang === 'bn' ? 'রেফারেল লিংক কপি করা হয়েছে!' : 'Referral link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const is30Days = period === '30days';
  const displayTotal = is30Days ? stats.totalEarnings30Days : stats.totalEarningsAllTime;
  const gen1Earned = is30Days ? stats.gen1Earnings30Days : stats.gen1EarningsAllTime;
  const gen2Earned = is30Days ? stats.gen2Earnings30Days : stats.gen2EarningsAllTime;
  const gen3Earned = is30Days ? stats.gen3Earnings30Days : stats.gen3EarningsAllTime;

  const activeMembersList =
    activeGenTab === 1
      ? stats.gen1Users
      : activeGenTab === 2
      ? stats.gen2Users
      : stats.gen3Users;

  const filteredTxs = (is30Days ? stats.last30DaysReferralTxs : stats.allReferralTxs).filter(
    (tx) => parseTxGeneration(tx) === activeGenTab
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-[#14213D] border border-[#2A3A5C] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A3A5C] bg-[#0A1128]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FCA311]/20 to-amber-500/10 border border-[#FCA311]/30 flex items-center justify-center text-[#FCA311]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {lang === 'bn' ? '৩ জেনারেশন রেফারেল প্যানেল' : '3-Generation Referral Center'}
              </h3>
              <p className="text-xs text-[#B0BBD4]">
                {lang === 'bn' ? 'টিম নেটওয়ার্ক ও ৩০ দিনের কমিশন' : 'Team Network & 30-Day Commission'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Period Toggle & Summary Card */}
          <div className="rounded-2xl bg-[#0A1128] border border-[#2A3A5C] p-4 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold text-[#B0BBD4] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FCA311]" />
                <span>
                  {is30Days
                    ? lang === 'bn'
                      ? 'গত ৩০ দিনে ৩ জেনারেশন আয়'
                      : 'Last 30 Days 3-Gen Earnings'
                    : lang === 'bn'
                    ? 'সর্বমোট ৩ জেনারেশন আয়'
                    : 'All-Time 3-Gen Total Earnings'}
                </span>
              </span>

              <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPeriod('30days')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    is30Days
                      ? 'bg-[#FCA311] text-black shadow-sm'
                      : 'text-[#B0BBD4] hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? '৩০ দিন' : '30 Days'}
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    !is30Days
                      ? 'bg-[#FCA311] text-black shadow-sm'
                      : 'text-[#B0BBD4] hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'সর্বমোট' : 'All'}
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-black text-white flex items-baseline">
                  <span className="text-[#FCA311] mr-1 text-2xl">৳</span>
                  {displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-[#B0BBD4] mt-0.5">
                  {lang === 'bn'
                    ? `মোট সদস্য: ${stats.totalTeamCount} জন (${stats.totalActiveCount} সক্রিয়)`
                    : `Total team: ${stats.totalTeamCount} members (${stats.totalActiveCount} active)`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">
                  {stats.last30DaysReferralTxs.length} {lang === 'bn' ? 'পেমেন্ট' : 'Payouts (30d)'}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Tier Generation Tab Selectors */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveGenTab(1)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeGenTab === 1
                  ? 'bg-[#FCA311]/15 border-[#FCA311] shadow-lg shadow-amber-500/10'
                  : 'bg-[#0A1128] border-[#2A3A5C] hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black text-[#FCA311]">Gen 1 (5%)</span>
              </div>
              <div className="text-base font-black text-white">৳{gen1Earned.toLocaleString()}</div>
              <div className="text-[10px] text-[#B0BBD4] mt-0.5">{stats.gen1Users.length} members</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveGenTab(2)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeGenTab === 2
                  ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#0A1128] border-[#2A3A5C] hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black text-emerald-400">Gen 2 (3%)</span>
              </div>
              <div className="text-base font-black text-white">৳{gen2Earned.toLocaleString()}</div>
              <div className="text-[10px] text-[#B0BBD4] mt-0.5">{stats.gen2Users.length} members</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveGenTab(3)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeGenTab === 3
                  ? 'bg-sky-500/15 border-sky-400 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#0A1128] border-[#2A3A5C] hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black text-sky-400">Gen 3 (2%)</span>
              </div>
              <div className="text-base font-black text-white">৳{gen3Earned.toLocaleString()}</div>
              <div className="text-[10px] text-[#B0BBD4] mt-0.5">{stats.gen3Users.length} members</div>
            </button>
          </div>

          {/* Referral Code & Link Box */}
          <div className="bg-gradient-to-r from-[#FCA311]/10 to-[#FCA311]/5 border border-[#FCA311]/30 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#B0BBD4]">Your Referral Code</span>
                <div className="text-lg font-mono font-black text-[#FCA311]">{currentUser.referralCode}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-[#FCA311] hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Members / History Section */}
          <div className="bg-[#0A1128] border border-[#2A3A5C] rounded-2xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A3A5C] mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#FCA311]" />
                <span>
                  {activeGenTab === 1 && (lang === 'bn' ? '১ম জেনারেশন সদস্যগণ' : '1st Generation (5% Direct)')}
                  {activeGenTab === 2 && (lang === 'bn' ? '২য় জেনারেশন সদস্যগণ' : '2nd Generation (3% Sub)')}
                  {activeGenTab === 3 && (lang === 'bn' ? '৩য় জেনারেশন সদস্যগণ' : '3rd Generation (2% Team)')}
                </span>
              </span>

              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewTab('members')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewTab === 'members' ? 'bg-white/20 text-white' : 'text-[#B0BBD4]'
                  }`}
                >
                  {lang === 'bn' ? 'সদস্য' : 'Members'} ({activeMembersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('history')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewTab === 'history' ? 'bg-white/20 text-white' : 'text-[#B0BBD4]'
                  }`}
                >
                  {lang === 'bn' ? 'কমিশন' : 'Payouts'} ({filteredTxs.length})
                </button>
              </div>
            </div>

            {viewTab === 'members' && (
              <div>
                {activeMembersList.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                    <Users className="w-6 h-6 text-gray-500 mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-gray-400">
                      {lang === 'bn' ? 'এই স্তরে এখনও কোনো সদস্য যোগ দেয়নি' : 'No members in this tier yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeMembersList.map((user, idx) => {
                      const isActive = (user.activePlanIndex !== undefined && user.activePlanIndex >= 0) || (user.investments && user.investments.some(inv => inv.status === 'active'));
                      return (
                        <div
                          key={user.id || user.phone || idx}
                          className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#14213D] border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                              {user.fullName?.charAt(0).toUpperCase() || idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-white">{user.fullName}</div>
                              <div className="text-[10px] text-[#B0BBD4]">
                                {user.phone ? `${user.phone.slice(0, 3)}••••${user.phone.slice(-4)}` : 'Verified'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {isActive ? 'Active Investor' : 'Registered'}
                            </div>
                            <div className="text-[9px] text-[#B0BBD4]">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Joined'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {viewTab === 'history' && (
              <div>
                {filteredTxs.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded-xl">
                    <Clock className="w-6 h-6 text-gray-500 mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-gray-400">
                      {lang === 'bn' ? 'কোনো কমিশন হিস্ট্রি নেই' : 'No commission records found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredTxs.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white line-clamp-1">{tx.title}</div>
                            <div className="text-[9px] text-[#B0BBD4]">{tx.date}</div>
                          </div>
                        </div>
                        <div className="font-black text-emerald-400 text-xs">
                          +৳{tx.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
