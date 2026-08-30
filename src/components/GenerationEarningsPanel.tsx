import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Users,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Share2,
  Gift,
  UserCheck,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useGenerationStats, parseTxGeneration } from '../utils/useGenerationStats';

interface GenerationEarningsPanelProps {
  variant?: 'full' | 'compact' | 'card';
  onOpenReferralsModal?: () => void;
}

export const GenerationEarningsPanel: React.FC<GenerationEarningsPanelProps> = ({
  variant = 'full',
  onOpenReferralsModal,
}) => {
  const { currentUser, users, transactions, lang, t, showToast } = useApp();
  const [period, setPeriod] = useState<'30days' | 'all'>('30days');
  const [activeGenTab, setActiveGenTab] = useState<1 | 2 | 3>(1);
  const [viewMode, setViewMode] = useState<'members' | 'history'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const stats = useGenerationStats(currentUser, users, transactions);

  if (!currentUser) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rjtrust.app';
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referralUrl = `${currentOrigin}${currentPathname}?ref=${currentUser.referralCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      showToast(lang === 'bn' ? 'রেফারেল লিংক কপি করা হয়েছে!' : 'Referral link copied!', 'success');
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUser.referralCode);
      setCopiedCode(true);
      showToast(lang === 'bn' ? 'রেফারেল কোড কপি করা হয়েছে!' : 'Referral code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  // Selected period amounts
  const is30Days = period === '30days';
  const displayTotal = is30Days ? stats.totalEarnings30Days : stats.totalEarningsAllTime;
  const gen1Earned = is30Days ? stats.gen1Earnings30Days : stats.gen1EarningsAllTime;
  const gen2Earned = is30Days ? stats.gen2Earnings30Days : stats.gen2EarningsAllTime;
  const gen3Earned = is30Days ? stats.gen3Earnings30Days : stats.gen3EarningsAllTime;

  // Active generation list
  const activeMembersList =
    activeGenTab === 1
      ? stats.gen1Users
      : activeGenTab === 2
      ? stats.gen2Users
      : stats.gen3Users;

  const filteredMembers = activeMembersList.filter((m) =>
    (m.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.phone || '').includes(searchQuery)
  );

  // Filter 30-day transactions for active generation or all
  const filteredTxs = (is30Days ? stats.last30DaysReferralTxs : stats.allReferralTxs).filter(
    (tx) => parseTxGeneration(tx) === activeGenTab
  );

  // Proportions for visual progress bar
  const totalForBar = gen1Earned + gen2Earned + gen3Earned || 1;
  const gen1Pct = Math.round((gen1Earned / totalForBar) * 100);
  const gen2Pct = Math.round((gen2Earned / totalForBar) * 100);
  const gen3Pct = Math.round((gen3Earned / totalForBar) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-[#14213D] via-[#1B2C52] to-[#0A1128] border border-[#2A3A5C] p-5 sm:p-6 shadow-2xl relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#FCA311]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FCA311]/20 to-amber-500/10 border border-[#FCA311]/30 flex items-center justify-center text-[#FCA311] shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                {lang === 'bn' ? '৩ জেনারেশন রেফারেল কমিশন' : '3-Generation Referral Earnings'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCA311]/20 text-[#FCA311] border border-[#FCA311]/30">
                {is30Days ? (lang === 'bn' ? 'গত ৩০ দিন' : 'Last 30 Days') : (lang === 'bn' ? 'সর্বমোট' : 'All Time')}
              </span>
            </div>
            <p className="text-xs text-[#B0BBD4]">
              {lang === 'bn'
                ? '১ম (৫%), ২য় (৩%) ও ৩য় (২%) জেনারেশন হতে সরাসরি অর্জিত কমিশন'
                : 'Residual commissions earned across Gen 1 (5%), Gen 2 (3%) & Gen 3 (2%)'}
            </p>
          </div>
        </div>

        {/* 30 Days vs All Time Toggle */}
        <div className="flex items-center self-start sm:self-auto bg-[#0A1128] p-1 rounded-2xl border border-[#2A3A5C] shadow-inner">
          <button
            type="button"
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              is30Days
                ? 'bg-gradient-to-r from-[#FCA311] to-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'text-[#B0BBD4] hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'গত ৩০ দিন' : 'Last 30 Days'}</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              !is30Days
                ? 'bg-gradient-to-r from-[#FCA311] to-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'text-[#B0BBD4] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সর্বমোট' : 'All Time'}</span>
          </button>
        </div>
      </div>

      {/* Main KPI Highlight Card */}
      <div className="relative z-10 mb-5 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B0BBD4] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FCA311]" />
              <span>
                {is30Days
                  ? lang === 'bn'
                    ? 'গত ৩০ দিনে ৩ জেনারেশন মোট আয়'
                    : 'Last 30 Days 3-Gen Total Earning'
                  : lang === 'bn'
                  ? 'সর্বমোট ৩ জেনারেশন কমিশন'
                  : 'All-Time 3-Gen Total Earning'}
              </span>
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-baseline">
                <span className="text-[#FCA311] mr-1 text-xl sm:text-3xl">৳</span>
                {displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {is30Days && stats.last30DaysReferralTxs.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +{stats.last30DaysReferralTxs.length} {lang === 'bn' ? 'টি লেনদেন' : 'Payouts'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#B0BBD4] mt-1">
              {lang === 'bn'
                ? `আপনার রেফারেল নেটওয়ার্কে মোট ${stats.totalTeamCount} জন সদস্য রয়েছে (${stats.totalActiveCount} জন সক্রিয় বিনিয়োগকারী)`
                : `Your affiliate network comprises ${stats.totalTeamCount} total members (${stats.totalActiveCount} active investors)`}
            </p>
          </div>

          <div className="flex sm:flex-col justify-between sm:justify-center sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-[#B0BBD4] uppercase font-semibold">Total Network</span>
              <div className="text-sm sm:text-base font-black text-white flex items-center sm:justify-end gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>{stats.totalTeamCount} Members</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#B0BBD4] uppercase font-semibold">Active Investors</span>
              <div className="text-sm sm:text-base font-black text-emerald-400 flex items-center justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{stats.totalActiveCount} Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Contribution Proportion Bar */}
        {displayTotal > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            {is30Days && stats.dailyEarnings30Days.length > 0 ? (
              <div className="mb-4">
                <div className="text-[10px] font-bold text-[#B0BBD4] mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '৩০ দিনের আয়ের ট্রেন্ড (৩ জেনারেশন)' : '30-Day Earnings Trend (3 Generations)'}</span>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.dailyEarnings30Days} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGen1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FCA311" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#FCA311" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGen2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGen3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} width={30} tickFormatter={(val) => `৳${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A1128', borderColor: '#2A3A5C', borderRadius: '8px', fontSize: '10px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => [`৳${value.toLocaleString()}`, name.replace('gen', 'Gen ')]}
                        labelStyle={{ color: '#B0BBD4', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="gen1" name="Gen 1" stroke="#FCA311" strokeWidth={2} fillOpacity={1} fill="url(#colorGen1)" stackId="1" />
                      <Area type="monotone" dataKey="gen2" name="Gen 2" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGen2)" stackId="1" />
                      <Area type="monotone" dataKey="gen3" name="Gen 3" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorGen3)" stackId="1" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            <div className="flex justify-between text-[10px] font-bold text-[#B0BBD4] mb-1.5">
              <span>{lang === 'bn' ? 'জেনারেশন ভিত্তিক আয়ের অনুপাত' : 'Earnings Distribution by Generation'}</span>
              <span>Gen 1: {gen1Pct}% | Gen 2: {gen2Pct}% | Gen 3: {gen3Pct}%</span>
            </div>
            <div className="h-2 w-full bg-[#0A1128] rounded-full overflow-hidden flex gap-0.5 border border-white/10">
              {gen1Earned > 0 && (
                <div
                  style={{ width: `${gen1Pct}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-[#FCA311] rounded-l-full"
                  title={`Gen 1: ৳${gen1Earned.toLocaleString()} (${gen1Pct}%)`}
                />
              )}
              {gen2Earned > 0 && (
                <div
                  style={{ width: `${gen2Pct}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#2ed573]"
                  title={`Gen 2: ৳${gen2Earned.toLocaleString()} (${gen2Pct}%)`}
                />
              )}
              {gen3Earned > 0 && (
                <div
                  style={{ width: `${gen3Pct}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-r-full"
                  title={`Gen 3: ৳${gen3Earned.toLocaleString()} (${gen3Pct}%)`}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3 Generation Breakdown Selector Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 relative z-10">
        {/* Gen 1 Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveGenTab(1)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveGenTab(1)}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
            activeGenTab === 1
              ? 'bg-[#FCA311]/15 border-[#FCA311] shadow-lg shadow-amber-500/10'
              : 'bg-black/30 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#FCA311]">
              1st Gen
            </span>
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#FCA311]/20 text-[#FCA311]">
              5%
            </span>
          </div>
          <div className="text-sm sm:text-lg font-black text-white truncate">
            ৳{gen1Earned.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#B0BBD4] mt-1">
            <span>{stats.gen1Users.length} {lang === 'bn' ? 'সদস্য' : 'Users'}</span>
            <span className="text-emerald-400 font-bold">{stats.gen1ActiveCount} act.</span>
          </div>
        </div>

        {/* Gen 2 Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveGenTab(2)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveGenTab(2)}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
            activeGenTab === 2
              ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
              : 'bg-black/30 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400">
              2nd Gen
            </span>
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
              3%
            </span>
          </div>
          <div className="text-sm sm:text-lg font-black text-white truncate">
            ৳{gen2Earned.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#B0BBD4] mt-1">
            <span>{stats.gen2Users.length} {lang === 'bn' ? 'সদস্য' : 'Users'}</span>
            <span className="text-emerald-400 font-bold">{stats.gen2ActiveCount} act.</span>
          </div>
        </div>

        {/* Gen 3 Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveGenTab(3)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveGenTab(3)}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
            activeGenTab === 3
              ? 'bg-sky-500/15 border-sky-400 shadow-lg shadow-cyan-500/10'
              : 'bg-black/30 border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-400">
              3rd Gen
            </span>
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400">
              2%
            </span>
          </div>
          <div className="text-sm sm:text-lg font-black text-white truncate">
            ৳{gen3Earned.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#B0BBD4] mt-1">
            <span>{stats.gen3Users.length} {lang === 'bn' ? 'সদস্য' : 'Users'}</span>
            <span className="text-emerald-400 font-bold">{stats.gen3ActiveCount} act.</span>
          </div>
        </div>
      </div>

      {/* Interactive Detail View (Members vs Recent Commissions) */}
      <div className="relative z-10 bg-black/50 border border-white/5 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {activeGenTab === 1 && (lang === 'bn' ? '১ম জেনারেশন (সরাসরি রেফারেল)' : '1st Gen Direct Referrals')}
              {activeGenTab === 2 && (lang === 'bn' ? '২য় জেনারেশন (সাব-রেফারেল)' : '2nd Gen Sub-Referrals')}
              {activeGenTab === 3 && (lang === 'bn' ? '৩য় জেনারেশন (টিম রেফারেল)' : '3rd Gen Team Referrals')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#B0BBD4]">
              {activeMembersList.length} {lang === 'bn' ? 'জন' : 'people'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#0A1128] p-0.5 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('members')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'members'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-[#B0BBD4] hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'সদস্য তালিকা' : 'Member List'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'history'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-[#B0BBD4] hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'কমিশন হিস্ট্রি' : 'Payout Log'}
            </button>
          </div>
        </div>

        {/* View Mode: Members */}
        {viewMode === 'members' && (
          <div>
            {activeMembersList.length > 3 && (
              <div className="mb-3 relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'bn' ? 'নাম বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by name or phone...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0A1128] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            )}

            {filteredMembers.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 bg-black/20 rounded-xl border border-dashed border-white/5">
                <Users className="w-7 h-7 text-gray-500 mx-auto mb-1.5 opacity-50" />
                <p className="font-semibold text-gray-300">
                  {lang === 'bn' ? 'এই জেনারেশনে কোনো সদস্য পাওয়া যায়নি' : 'No members found in this generation'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn'
                    ? 'আপনার রেফারেল লিংক শেয়ার করে টিম বড় করুন এবং ৩ স্তরের কমিশন আয় করুন!'
                    : 'Share your referral code to build your 3-generation network!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredMembers.map((member, idx) => {
                  const hasPlan = (member.activePlanIndex !== undefined && member.activePlanIndex >= 0) || (member.investments && member.investments.some(inv => inv.status === 'active'));
                  return (
                    <div
                      key={member.id || member.phone || idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            activeGenTab === 1
                              ? 'bg-[#FCA311]/20 text-[#FCA311]'
                              : activeGenTab === 2
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-sky-500/20 text-sky-400'
                          }`}
                        >
                          {member.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{member.fullName}</span>
                            {hasPlan && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                VIP Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#B0BBD4] font-mono">
                            {member.phone ? `${member.phone.slice(0, 3)}••••${member.phone.slice(-4)}` : 'Verified User'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-[#B0BBD4]">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString()
                            : 'Joined'}
                        </div>
                        <div className="text-[9px] text-amber-400/80 font-bold">
                          {activeGenTab === 1 ? '5% Rate' : activeGenTab === 2 ? '3% Rate' : '2% Rate'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View Mode: Commission History Log */}
        {viewMode === 'history' && (
          <div>
            {filteredTxs.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 bg-black/20 rounded-xl border border-dashed border-white/5">
                <Clock className="w-7 h-7 text-gray-500 mx-auto mb-1.5 opacity-50" />
                <p className="font-semibold text-gray-300">
                  {lang === 'bn'
                    ? is30Days
                      ? 'গত ৩০ দিনে এই জেনারেশন হতে কোনো কমিশন জমা হয়নি'
                      : 'এই জেনারেশন হতে এখনও কোনো কমিশন জমা হয়নি'
                    : is30Days
                    ? 'No commissions from this generation in the last 30 days'
                    : 'No commission payouts recorded for this generation yet'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {lang === 'bn'
                    ? 'টিমের সদস্যরা বিনিয়োগ করলে সাথে সাথে আপনার অ্যাকাউন্টে কমিশন জমা হবে।'
                    : 'Commissions are credited instantly whenever your team members invest!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white line-clamp-1">
                          {lang === 'bn' ? tx.titleBn || tx.title : tx.title}
                        </div>
                        <div className="text-[10px] text-[#B0BBD4] flex items-center gap-1.5">
                          <span>{tx.date}</span>
                          {tx.details && <span>• {tx.details}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-black text-emerald-400 text-sm whitespace-nowrap pl-2">
                      +৳{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Share & Dashboard Bar */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 relative z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 text-xs font-mono font-bold text-[#FCA311] flex items-center gap-1.5 transition-all"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{currentUser.referralCode}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FCA311] to-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'লিংক কপি' : 'Copy Link')}</span>
          </button>
        </div>

        {onOpenReferralsModal && (
          <button
            type="button"
            onClick={onOpenReferralsModal}
            className="text-xs font-bold text-[#FCA311] hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>{lang === 'bn' ? 'সম্পূর্ণ রেফারেল ড্যাশবোর্ড' : 'Full Referral Dashboard'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
