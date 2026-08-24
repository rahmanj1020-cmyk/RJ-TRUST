import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Shield,
  KeyRound,
  PhoneCall,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  LogOut,
  Copy,
  Check,
  ChevronRight,
  ReceiptText,
  Sparkles,
  Link as LinkIcon,
  Share2,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ReferralsModal } from './ReferralsModal';
import { InvestmentHistoryModal } from './InvestmentHistoryModal';
import { SUPPORT_CONFIG } from '../data/constants';

interface AccountTabProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenChangePassword: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenChangePassword,
}) => {
  const { currentUser, logout, t, lang, setActiveTab, showToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  if (!currentUser) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rjtrust.app';
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referralUrl = `${currentOrigin}${currentPathname}?ref=${currentUser.referralCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      showToast(lang === 'bn' ? 'রেফারেল লিংক কপি করা হয়েছে!' : 'Referral link copied!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyRef = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUser.referralCode);
      setCopiedCode(true);
      showToast(lang === 'bn' ? 'রেফারেল কোড কপি করা হয়েছে!' : 'Referral code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleShare = () => {
    const shareText =
      lang === 'bn'
        ? `RJ TRUST প্ল্যাটফর্মে যুক্ত হয়ে প্রতিদিন নিশ্চিত মুনাফা আয় করুন! রেফারেল কোড: ${currentUser.referralCode}\n${referralUrl}`
        : `Join RJ TRUST — TRUST • GROW • INFINITE! Referral code: ${currentUser.referralCode}\n${referralUrl}`;

    if (navigator.share) {
      navigator
        .share({
          title: 'RJ TRUST Investment',
          text: shareText,
          url: referralUrl,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-[#14213D] via-[#1B2C52] to-[#0A1128] border border-[#2A3A5C] p-6 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FCA311] via-amber-400 to-[#14213D] p-1 mx-auto mb-3 shadow-xl shadow-amber-500/20">
          <div className="w-full h-full bg-[#050811] rounded-full flex items-center justify-center text-2xl font-black text-[#FCA311]">
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
        </div>

        <h2 className="text-xl font-black text-white">{currentUser.fullName}</h2>
        <p className="text-xs font-semibold text-[#B0BBD4] mt-0.5">{currentUser.phone}</p>
        <p className="text-[11px] text-[#B0BBD4] font-mono mt-0.5">
          Account ID: <span className="font-bold text-white">{currentUser.id}</span>
        </p>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 border border-[#FCA311]/40 text-xs font-black text-[#FCA311]">
          <span>VIP {currentUser.activePlanIndex >= 0 ? currentUser.activePlanIndex + 1 : 0} Member</span>
        </div>
      </motion.div>

      {/* Referral Summary */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[#14213D] border border-[#2A3A5C] p-5 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Referral Summary</h3>
              <p className="text-xs text-[#B0BBD4]">Grow your network</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#B0BBD4]">Bonus Earnings</p>
            <p className="text-lg font-black text-[#FCA311]">৳ {currentUser.commission.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#B0BBD4]">Total Referrals</span>
            <span className="text-white">{currentUser.referralCount} <span className="text-gray-500">/ 100</span></span>
          </div>
          <div className="h-2 w-full bg-[#0A1128] rounded-full overflow-hidden border border-[#2A3A5C]/50 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentUser.referralCount / 100) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
          <p className="text-[10px] text-center text-[#B0BBD4] pt-1">
            {100 - currentUser.referralCount > 0 
              ? `Invite ${100 - currentUser.referralCount} more friends to reach the next milestone!` 
              : 'Amazing! You reached the ultimate milestone!'}
          </p>
        </div>
      </motion.div>

      {/* Action Menu List */}
      <div className="rounded-2xl bg-[#14213D] border border-[#2A3A5C] divide-y divide-white/5 shadow-xl overflow-hidden">
        <button
          onClick={onOpenDeposit}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#FCA311]">
              {t('depositMenu')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>

        <button
          onClick={onOpenWithdraw}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2ed573]/15 text-[#2ed573] flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#2ed573]">
              {t('withdrawMenu')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-indigo-300">
              Investment History
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>        <button
          onClick={() => setShowReferralsModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FCA311]/15 text-[#FCA311] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#FCA311]">
              Referral Dashboard
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openLeaderboardModal'))}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-purple-300">
              Leaderboard ✨
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>        <button
          onClick={() => setActiveTab('tx')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-blue-300">
              {t('txTitle')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>

        <a
          href={SUPPORT_CONFIG.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs md:text-sm font-bold text-white group-hover:text-emerald-300 block">
                {t('whatsappSupport')}
              </span>
              <span className="text-[10px] text-[#B0BBD4]">Direct WhatsApp Hotline</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </a>

        <button
          onClick={onOpenChangePassword}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold text-white group-hover:text-amber-300">
              {t('changePw')}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>

        <button
          onClick={logout}
          className="w-full p-4 flex items-center justify-between hover:bg-red-500/10 transition-all text-left group text-red-400"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-xs md:text-sm font-bold">{t('logout')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-500" />
        </button>
      </div>
      {showReferralsModal && <ReferralsModal onClose={() => setShowReferralsModal(false)} />}
      {showHistoryModal && <InvestmentHistoryModal onClose={() => setShowHistoryModal(false)} />}
    </div>
  );
};
