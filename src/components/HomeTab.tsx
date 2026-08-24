import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Users,
  Crown,
  Clock,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Link as LinkIcon,
  Copy, Send,
  Check,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RJ_PLANS } from '../data/constants';

interface HomeTabProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onOpenDeposit, onOpenWithdraw }) => {
  const { currentUser, transactions, t, lang, claimDailyIncome, dailyCheckIn, setActiveTab, showToast } = useApp();
  const [now, setNow] = useState(Date.now());
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rjtrust.app';
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referralUrl = `${currentOrigin}${currentPathname}?ref=${currentUser.referralCode}`;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      showToast(lang === 'bn' ? 'রেফারেল লিংক কপি করা হয়েছে!' : 'Referral link copied!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentPlan = currentUser.activePlanIndex >= 0 ? RJ_PLANS[currentUser.activePlanIndex] : null;
  const today = new Date().toISOString().slice(0, 10);

  // Helper for formatting time remaining
  const formatTimeRemaining = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) return '00:00:00';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate days left for primary plan
  let daysRemaining = 0;
  if (currentPlan && currentUser.planStartDate) {
    const daysPassed = Math.floor((new Date(today).getTime() - new Date(currentUser.planStartDate).getTime()) / 86400000);
    daysRemaining = Math.max(0, currentPlan.days - daysPassed);
  }

  // Filter user's recent transactions
  const userTransactions = transactions.filter((tx) => tx.userId === currentUser.phone).slice(0, 5);

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Primary Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14213D] via-[#1B2C52] to-[#0A1128] border border-[#2A3A5C] p-6 shadow-2xl"
      >
        {/* Glow ambient background shape */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FCA311]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#FCA311]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#B0BBD4]">
              {t('balance')}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-black/40 border border-[#FCA311]/40 text-[#FCA311] text-xs font-extrabold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            <span>VIP {currentUser.activePlanIndex >= 0 ? currentUser.activePlanIndex + 1 : 0}</span>
          </div>
        </div>

        <div className="my-2">
          <span className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
            <span className="text-[#FCA311] text-2xl md:text-3xl font-extrabold">৳</span>
            <span>{currentUser.balance === 0 ? '000' : currentUser.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-[#B0BBD4]">
            <span>{t('commission')}:</span>
            <span className="font-bold text-[#FCA311]">
              ৳{currentUser.commission === 0 ? '000' : currentUser.commission.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#2ed573] font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Returns</span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons: Deposit & Withdraw */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onOpenDeposit}
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-black text-sm shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all hover:brightness-105"
        >
          <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          <span>{t('deposit')}</span>
        </button>

        <button
          onClick={onOpenWithdraw}
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#14213D] hover:bg-[#1b2c52] border border-[#2A3A5C] text-white font-black text-sm shadow-xl shadow-black/40 active:scale-[0.98] transition-all"
        >
          <ArrowUpRight className="w-5 h-5 text-[#FCA311] stroke-[2.5]" />
          <span>{t('withdraw')}</span>
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openTransferModal'))}
          className="flex items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl bg-[#14213D] hover:bg-[#1b2c52] border border-[#2A3A5C] text-white font-black text-xs sm:text-sm shadow-xl shadow-black/40 active:scale-[0.98] transition-all"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 stroke-[2.5]" />
          <span>P2P Transfer</span>
        </button>
      </div>

      {/* Daily Claim Section */}
      {currentUser.investments && currentUser.investments.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#B0BBD4] flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#FCA311]" />
              <span>{t('claimTitle')}</span>
            </h3>
            <span className="text-[10px] text-[#2ed573] font-bold bg-[#2ed573]/10 px-2 py-0.5 rounded-full border border-[#2ed573]/30">
              Daily Claim
            </span>
          </div>

          <div className="space-y-2">
            {currentUser.investments.map((inv) => {
              const planIdx = inv.planId - 1;
              const planDef = RJ_PLANS[planIdx];
              const daysPassed = Math.floor((new Date(today).getTime() - new Date(inv.startDate).getTime()) / 86400000);
              const isExpired = inv.claimedDays >= inv.days;

              // Calculate 24-hour claim readiness
              const baseTime = inv.lastClaimedAt || inv.activatedAt || (inv.startDate ? new Date(inv.startDate).getTime() : now);
              const nextClaimTime = inv.nextClaimAt || (baseTime + 24 * 60 * 60 * 1000);
              const isClaimReady = now >= nextClaimTime;
              const timeString = formatTimeRemaining(nextClaimTime);

              return (
                <div
                  key={inv.id}
                  className="rounded-2xl border p-4 flex items-center justify-between gap-3 shadow-lg"
                  style={{
                    backgroundColor: planDef?.bgColor || '#14213D',
                    borderColor: `${planDef?.accentColor || '#FCA311'}44`,
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${planDef?.accentColor || '#FCA311'}22`,
                          color: planDef?.accentColor || '#FCA311',
                        }}
                      >
                        VIP {inv.planId}
                      </span>
                      <span className="font-extrabold text-sm text-white">{inv.planName}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-lg font-black"
                        style={{ color: planDef?.accentColor || '#FCA311' }}
                      >
                        ৳{inv.dailyIncome === 0 ? '000' : inv.dailyIncome.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#B0BBD4]">/ day profit</span>
                    </div>
                    <div className="text-[10px] text-[#B0BBD4] mt-0.5 flex items-center gap-2">
                      <span>{inv.claimedDays}/{inv.days} {t('daysOf')}</span>
                      <span className="text-white/30">•</span>
                      <span className="text-amber-400/90 font-medium">24h Schedule</span>
                    </div>
                  </div>

                  <div>
                    {isExpired ? (
                      <span className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#B0BBD4]">
                        {t('expired')}
                      </span>
                    ) : isClaimReady ? (
                      <button
                        onClick={() => claimDailyIncome(planIdx)}
                        className="px-4 py-2.5 rounded-xl font-black text-xs text-black shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse cursor-pointer hover:brightness-110"
                        style={{
                          background: `linear-gradient(135deg, ${planDef?.accentColor || '#FCA311'}, #FCA311)`,
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Claim ৳{inv.dailyIncome}</span>
                      </button>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-black/40 border border-amber-500/30 text-right">
                        <div className="text-[9px] text-[#B0BBD4] font-medium flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-[#FCA311]" />
                          <span>Next Payout in</span>
                        </div>
                        <div className="text-xs font-mono font-black text-[#FCA311]">
                          {timeString}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account Snapshot Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div
          onClick={() => setActiveTab('invest')}
          className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-3 text-center cursor-pointer hover:border-[#FCA311]/50 transition-all"
        >
          <div className="text-lg font-black text-[#FCA311]">{currentUser.referralCount || 0}</div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-0.5">
            {t('refer')}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('vip')}
          className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-3 text-center cursor-pointer hover:border-[#FCA311]/50 transition-all"
        >
          <div className="text-lg font-black text-white">
            {currentPlan ? currentPlan.name.split(' ')[0] : 'None'}
          </div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-0.5">
            {t('activePlan')}
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-3 text-center">
          <div className="text-lg font-black text-[#2ed573]">{daysRemaining}</div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-0.5">
            {t('daysLeft')}
          </div>
        </div>
      </div>

      {/* My Active Investments Deep View */}
      {currentUser.investments && currentUser.investments.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#B0BBD4] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#FCA311]" />
              <span>{t('myInvest')}</span>
            </h3>
            <button
              onClick={() => setActiveTab('vip')}
              className="text-xs font-bold text-[#FCA311] hover:underline"
            >
              + Upgrade Tier
            </button>
          </div>

          <div className="space-y-2.5">
            {currentUser.investments.map((inv) => {
              const planDef = RJ_PLANS[inv.planId - 1];
              const daysPassed = Math.floor((new Date(today).getTime() - new Date(inv.startDate).getTime()) / 86400000);
              const progressPct = Math.min(100, Math.round((daysPassed / inv.days) * 100));
              const totalEarnedSoFar = Math.min(daysPassed, inv.days) * inv.dailyIncome;

              return (
                <div
                  key={inv.id}
                  className="rounded-2xl p-4 border bg-[#14213D] shadow-lg"
                  style={{
                    borderColor: `${planDef?.accentColor || '#FCA311'}55`,
                    borderLeftWidth: '4px',
                    borderLeftColor: planDef?.accentColor || '#FCA311',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${planDef?.accentColor || '#FCA311'}22`,
                          color: planDef?.accentColor || '#FCA311',
                        }}
                      >
                        VIP {inv.planId}
                      </span>
                      <span className="ml-2 font-bold text-sm text-white">{inv.planName}</span>
                    </div>
                    <span className="text-[11px] text-[#B0BBD4] font-medium">{inv.startDate}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-black/30 p-2 rounded-xl text-center">
                      <div className="text-xs font-black text-red-400">৳{inv.investAmount === 0 ? '000' : inv.investAmount.toLocaleString()}</div>
                      <div className="text-[9px] text-[#B0BBD4] mt-0.5">Invested</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl text-center">
                      <div className="text-xs font-black text-[#2ed573]">৳{inv.dailyIncome.toLocaleString()}</div>
                      <div className="text-[9px] text-[#B0BBD4] mt-0.5">Daily Profit</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl text-center">
                      <div className="text-xs font-black text-[#FCA311]">৳{totalEarnedSoFar === 0 ? '000' : totalEarnedSoFar.toLocaleString()}</div>
                      <div className="text-[9px] text-[#B0BBD4] mt-0.5">Earned</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded-xl text-center">
                      <div className="text-xs font-black text-white">{Math.max(0, inv.days - daysPassed)} d</div>
                      <div className="text-[9px] text-[#B0BBD4] mt-0.5">Days Left</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-[#B0BBD4] mb-1">
                      <span>{t('progress')}: {progressPct}%</span>
                      <span>{daysPassed}/{inv.days} {t('daysOf')}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPct}%`,
                          background: `linear-gradient(90deg, ${planDef?.accentColor || '#FCA311'}, #FCA311)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Referral Quick Promo Banner */}
      <div
        onClick={() => setActiveTab('invest')}
        className="rounded-2xl bg-gradient-to-r from-[#14213D] via-[#1B2C52] to-black border border-[#FCA311]/40 p-3.5 shadow-lg flex items-center justify-between gap-3 cursor-pointer hover:border-[#FCA311] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white">{t('refLink')}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FCA311] text-black">
                5% + 3% + 2%
              </span>
            </div>
            <div className="text-[10px] text-amber-300 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-xs">
              {currentUser.referralCode}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyLink}
            className="py-1.5 px-3 rounded-lg bg-[#FCA311] hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center gap-1 shadow-md active:scale-95 transition-all whitespace-nowrap"
          >
            {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#B0BBD4]">
            {t('recentTx')}
          </h3>
          <button
            onClick={() => setActiveTab('tx')}
            className="text-xs font-bold text-[#FCA311] hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-3 shadow-lg divide-y divide-white/5">
          {userTransactions.length > 0 ? (
            userTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                        isPositive
                          ? 'bg-[#2ed573]/15 text-[#2ed573]'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {lang === 'bn' ? tx.titleBn || tx.title : tx.title}
                      </div>
                      <div className="text-[10px] text-[#B0BBD4] flex items-center gap-1.5">
                        <span>{tx.date}</span>
                        {tx.status === 'pending' && (
                          <span className="text-amber-400 font-bold">• Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`text-xs font-black ${isPositive ? 'text-[#2ed573]' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}৳{Math.abs(tx.amount) === 0 ? '000' : Math.abs(tx.amount).toLocaleString()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-[#B0BBD4] text-xs">
              {t('noTx')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
