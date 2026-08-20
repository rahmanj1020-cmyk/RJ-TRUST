import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Shield,
  KeyRound,
  PhoneCall,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  Copy,
  Check,
  ChevronRight,
  ReceiptText,
  Sparkles,
  Link as LinkIcon,
  Share2,
  Users,
  HardDrive,
  Mail,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORT_CONFIG } from '../data/constants';
import { getCachedGoogleUser, getWorkspaceAccessToken, initWorkspaceAuth } from '../lib/googleWorkspace';

interface AccountTabProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenChangePassword: () => void;
  onOpenWorkspace?: (tab: 'drive' | 'gmail') => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenChangePassword,
  onOpenWorkspace,
}) => {
  const { currentUser, logout, t, lang, setActiveTab, showToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(getCachedGoogleUser());
  const [hasGoogleToken, setHasGoogleToken] = useState<boolean>(!!getWorkspaceAccessToken());

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasGoogleToken(!!token);
      },
      () => {
        setGoogleUser(null);
        setHasGoogleToken(false);
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

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

      {/* Referral Link & Code Promotion Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#14213D] via-[#1B2C52] to-black border-2 border-[#FCA311]/50 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FCA311]" />
            <h4 className="font-black text-sm text-white">{t('refLink')}</h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCA311]/20 text-[#FCA311] border border-[#FCA311]/30">
            {t('totalRef')}: {currentUser.referralCount || 0}
          </span>
        </div>

        {/* Link box */}
        <div className="bg-black/60 border border-[#2A3A5C] rounded-xl p-2.5 flex items-center gap-2 mb-3">
          <LinkIcon className="w-3.5 h-3.5 text-[#FCA311] shrink-0" />
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="bg-transparent text-xs text-amber-200 font-mono flex-1 outline-none truncate"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopyLink}
            className="py-2 px-2 rounded-xl bg-[#FCA311] hover:bg-amber-400 text-black font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="truncate">{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleCopyRef}
            className="py-2 px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-[#2A3A5C] text-white font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-[#2ed573]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="truncate">{copiedCode ? 'Copied' : `Code: ${currentUser.referralCode}`}</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2 px-2 rounded-xl bg-[#14213D] hover:bg-[#1b2c52] border border-[#2A3A5C] text-white font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FCA311]" />
            <span className="truncate">{t('share')}</span>
          </button>
        </div>
      </div>

      {/* Google Workspace Integration Hub Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0d1b38] via-[#14213D] to-black border-2 border-emerald-500/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <span>Google Workspace Hub</span>
                <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
                  {hasGoogleToken ? 'Connected' : 'Drive & Gmail'}
                </span>
              </h4>
              <p className="text-[11px] text-[#B0BBD4]">
                {hasGoogleToken && googleUser?.email
                  ? `Linked to ${googleUser.email}`
                  : 'Backup portfolio to Drive & send statements via Gmail'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onOpenWorkspace && onOpenWorkspace('drive')}
            className="p-3 rounded-2xl bg-black/50 hover:bg-black/70 border border-white/10 hover:border-amber-400/50 flex items-center gap-2.5 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#FCA311] flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white group-hover:text-[#FCA311] truncate">Google Drive</div>
              <div className="text-[10px] text-[#B0BBD4] truncate">Save & View Statements</div>
            </div>
          </button>

          <button
            onClick={() => onOpenWorkspace && onOpenWorkspace('gmail')}
            className="p-3 rounded-2xl bg-black/50 hover:bg-black/70 border border-white/10 hover:border-blue-400/50 flex items-center gap-2.5 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white group-hover:text-blue-300 truncate">Gmail Service</div>
              <div className="text-[10px] text-[#B0BBD4] truncate">Send & View Emails</div>
            </div>
          </button>
        </div>
      </div>

      {/* Action Menu List */}
      <div className="rounded-2xl bg-[#14213D] border border-[#2A3A5C] divide-y divide-white/5 shadow-xl overflow-hidden">
        <button
          onClick={() => onOpenWorkspace && onOpenWorkspace('drive')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-[#FCA311] flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs md:text-sm font-bold text-white group-hover:text-[#FCA311] block">
                Google Drive Storage
              </span>
              <span className="text-[10px] text-[#B0BBD4]">Export & organize statements in Google Drive</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>

        <button
          onClick={() => onOpenWorkspace && onOpenWorkspace('gmail')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs md:text-sm font-bold text-white group-hover:text-blue-300 block">
                Gmail Dispatch & Reports
              </span>
              <span className="text-[10px] text-[#B0BBD4]">Send certified financial reports via your Gmail</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
        </button>

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
    </div>
  );
};
