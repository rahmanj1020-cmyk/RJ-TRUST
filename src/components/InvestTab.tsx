import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Copy,
  Users,
  Gift,
  Check,
  Sparkles,
  TrendingUp,
  Calculator,
  ArrowRight,
  Shield,
  Link as LinkIcon,
  QrCode,
  Send,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../context/AppContext';
import { RJ_PLANS } from '../data/constants';
import { InvestmentPlan, User } from '../types';
import { GenerationEarningsPanel } from './GenerationEarningsPanel';

interface InvestTabProps {
  onSelectPlan: (plan: InvestmentPlan) => void;
}

export const InvestTab: React.FC<InvestTabProps> = ({ onSelectPlan }) => {
  const { currentUser, users, transactions, t, lang, showToast } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Profit Calculator State
  const [calcAmount, setCalcAmount] = useState<number | string>(300);
  const [calcPlanId, setCalcPlanId] = useState<number>(RJ_PLANS[0].id);

  const selectedCalcPlan = RJ_PLANS.find(p => p.id === calcPlanId) || RJ_PLANS[0];
  const dailyPercent = selectedCalcPlan.dailyIncome / selectedCalcPlan.investAmount;
  const calcDaily = (Number(calcAmount) || 0) * dailyPercent;
  const calcWeekly = calcDaily * 7;
  const calcMonthly = calcDaily * 30;

  if (!currentUser) return null;

  // Generate dynamic referral link based on current browser URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://rjtrust.app';
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referralUrl = `${currentOrigin}${currentPathname}?ref=${currentUser.referralCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      showToast(lang === 'bn' ? 'রেফারেল লিংক কপি করা হয়েছে!' : 'Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUser.referralCode);
      setCopiedCode(true);
      showToast(lang === 'bn' ? 'রেফারেল কোড কপি করা হয়েছে!' : 'Referral code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const shareText =
    lang === 'bn'
      ? `RJ TRUST প্ল্যাটফর্মে যুক্ত হয়ে প্রতিদিন নিশ্চিত মুনাফা ও ৩ স্তরের আকর্ষণীয় রেফারেল কমিশন আয় করুন!\n\nআমার রেফারেল কোড: ${currentUser.referralCode}\nরেজিস্ট্রেশন লিংক:`
      : `Join RJ TRUST — TRUST • GROW • INFINITE! Earn daily guaranteed returns and 3-generation passive referral commissions.\n\nMy Referral Code: ${currentUser.referralCode}\nRegistration Link:`;

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'RJ TRUST Investment Platform',
          text: `${shareText}\n${referralUrl}`,
          url: referralUrl,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const fullMsg = `${shareText}\n${referralUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMsg)}`;
    window.open(waUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(fbUrl, '_blank');
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Referral & Invite Center Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-[#14213D] via-[#1B2C52] to-black border-2 border-[#FCA311]/60 p-5 md:p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FCA311]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FCA311]/20 border border-[#FCA311]/40 flex items-center justify-center text-[#FCA311]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-1.5">
                <span>{t('refLink')}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCA311] text-black">
                  3 Tiers
                </span>
              </h3>
              <p className="text-[11px] text-[#B0BBD4]">{t('inviteSub')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowQrCode(!showQrCode)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-[#2A3A5C] text-xs font-bold text-[#FCA311] flex items-center gap-1.5 transition-all"
            title="Toggle QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showQrCode ? 'Hide QR' : 'QR Code'}</span>
          </button>
        </div>

        {/* Dynamic Referral Link Box */}
        <div className="my-3 p-3 rounded-2xl bg-black/70 border border-[#2A3A5C] relative z-10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#B0BBD4] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-[#FCA311]" />
              <span>{t('refLink')}</span>
            </span>
            <span className="text-[10px] text-amber-400 font-mono">1-Click Auto Registration</span>
          </div>

          <div className="flex items-center gap-2 bg-[#0A1128] border border-[#2A3A5C] rounded-xl p-2.5 overflow-hidden">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="bg-transparent text-xs text-amber-200 font-mono flex-1 outline-none select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3.5 rounded-lg bg-[#FCA311] hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t('copied') : t('copy')}</span>
            </button>
          </div>
        </div>

        {/* Referral Code Mini Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 relative z-10">
          <div className="p-3 rounded-2xl bg-black/50 border border-[#FCA311]/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#B0BBD4] uppercase font-bold">{t('refCode')}</div>
              <div className="text-xl font-black tracking-widest text-[#FCA311] font-mono">
                {currentUser.referralCode}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-[#2A3A5C] text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#2ed573]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Native Share Button */}
          <button
            onClick={handleNativeShare}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>{lang === 'bn' ? 'রেফারেল লিংক শেয়ার করুন' : 'Share Referral Link'}</span>
          </button>
        </div>

        {/* Social Sharing Direct Actions */}
        <div className="pt-2 border-t border-white/10 relative z-10">
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mb-2">
            {t('shareSocial')}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleTelegramShare}
              className="py-2 px-3 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
            <button
              onClick={handleFacebookShare}
              className="py-2 px-3 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-[#1877F2] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* QR Code Collapsible View */}
        <AnimatePresence>
          {showQrCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-2xl bg-black/80 border border-[#FCA311]/50 text-center flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#FCA311]" />
                <span>{t('scanQr')}</span>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-xl shadow-amber-500/20 mb-2">
                <QRCodeSVG
                  value={referralUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <p className="text-[11px] text-[#B0BBD4]">
                Scan with any smartphone camera to register directly with your referral code.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3-Generation Total Earnings & Team Panel */}
      <GenerationEarningsPanel />

      
      {/* Interactive Profit Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-[#14213D] border border-[#2A3A5C] p-5 shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Profit Calculator</h3>
            <p className="text-[10px] text-[#B0BBD4]">Estimate your potential earnings</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">Select Plan Base</label>
              <select
                value={calcPlanId}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  setCalcPlanId(pid);
                  const p = RJ_PLANS.find(x => x.id === pid);
                  if (p) setCalcAmount(p.investAmount);
                }}
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all appearance-none"
              >
                {RJ_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {(plan.dailyIncome / plan.investAmount * 100).toFixed(1)}% Daily
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">Deposit Amount (৳)</label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center mt-2">
            <div className="bg-[#0A1128] p-3 rounded-xl border border-[#2A3A5C]/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
              <div className="text-[10px] text-[#B0BBD4] mb-1 font-medium relative z-10">Daily Return</div>
              <div className="text-sm md:text-base font-black text-[#2ed573] relative z-10">৳{calcDaily.toFixed(2)}</div>
            </div>
            <div className="bg-[#0A1128] p-3 rounded-xl border border-[#2A3A5C]/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="text-[10px] text-[#B0BBD4] mb-1 font-medium relative z-10">Weekly Return</div>
              <div className="text-sm md:text-base font-black text-blue-400 relative z-10">৳{calcWeekly.toFixed(2)}</div>
            </div>
            <div className="bg-[#0A1128] p-3 rounded-xl border border-[#2A3A5C]/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="text-[10px] text-[#B0BBD4] mb-1 font-medium relative z-10">Monthly Return</div>
              <div className="text-sm md:text-base font-black text-[#FCA311] relative z-10">৳{calcMonthly.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Investment Plans Catalog Header */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#B0BBD4] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#FCA311]" />
            <span>{t('investTitle')}</span>
          </h3>
          <span className="text-xs text-[#B0BBD4]">15 Fixed Deposit Packages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RJ_PLANS.slice(0, 6).map((plan) => {
            const isInvested = currentUser.investments.some(
              (inv) => inv.planId === plan.id && inv.status === 'active'
            );

            return (
              <div
                key={plan.id}
                className="rounded-2xl p-4 border bg-[#14213D] shadow-lg flex flex-col justify-between"
                style={{
                  borderColor: `${plan.accentColor}44`,
                  borderLeftWidth: '4px',
                  borderLeftColor: plan.accentColor,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${plan.accentColor}25`,
                        color: plan.accentColor,
                      }}
                    >
                      VIP {plan.vipLevel}
                    </span>
                    <span className="text-xs font-black text-white">
                      ৳{plan.investAmount.toLocaleString()}
                    </span>
                  </div>

                  <h4
                    className="font-extrabold text-base text-white mb-2"
                    style={{ color: plan.accentColor }}
                  >
                    {plan.name}
                  </h4>

                  <div className="grid grid-cols-4 gap-1 text-center text-xs mb-3 bg-black/30 p-2 rounded-xl">
                    <div>
                      <div className="font-black text-[#2ed573]">৳{plan.dailyIncome.toLocaleString()}</div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('dailyIncome')}</div>
                    </div>
                    <div>
                      <div className="font-black text-white">{plan.days}d</div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('duration')}</div>
                    </div>
                    <div>
                      <div className="font-black text-[#FCA311]">
                        ৳{(plan.dailyIncome * plan.days).toLocaleString()}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('totalReturn')}</div>
                    </div>
                    <div>
                      <div className="font-black text-emerald-400">
                        ৳{((plan.dailyIncome * plan.days) - plan.investAmount).toLocaleString()}
                      </div>
                      <div className="text-[8px] sm:text-[9px] text-[#B0BBD4] whitespace-nowrap overflow-hidden text-ellipsis">{t('netProfit')}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPlan(plan)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-black cursor-pointer shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${plan.accentColor}, #FCA311)`,
                  }}
                >
                  <span>{isInvested ? 'Active Package' : t('investBtn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

