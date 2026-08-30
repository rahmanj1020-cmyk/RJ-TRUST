import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Smartphone,
  History,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Fingerprint,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SecurityLogItem } from '../types';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setSecurityPin,
    togglePinRequirement,
    setAutoLockMinutes,
    terminateOtherSessions,
    lang,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'pin' | 'sessions' | 'logs' | 'autolock'>('overview');

  // PIN Form State
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [passwordVerify, setPasswordVerify] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Calculate Security Health Score
  let score = 30; // base score for registration
  if (currentUser.password && currentUser.password.length >= 8) score += 25;
  else if (currentUser.password && currentUser.password.length >= 6) score += 15;
  if (currentUser.securityPin && currentUser.securityPin.length === 4) score += 30;
  if (currentUser.isPinEnabled) score += 10;
  if (currentUser.autoLockMinutes && currentUser.autoLockMinutes > 0) score += 5;
  score = Math.min(100, score);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (s >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      showToast(lang === 'bn' ? '৪ ডিজিটের সংখ্যাসূচক পিন দিন (যেমন: 1234)' : 'PIN must be exactly 4 numeric digits', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast(lang === 'bn' ? 'দুটো পিন মিলছে না' : 'PINs do not match', 'error');
      return;
    }
    if (!passwordVerify) {
      showToast(lang === 'bn' ? 'নিশ্চিতকরণের জন্য আপনার বর্তমান পাসওয়ার্ড দিন' : 'Enter current password for verification', 'error');
      return;
    }

    setIsSubmittingPin(true);
    const res = await setSecurityPin(newPin, passwordVerify);
    setIsSubmittingPin(false);

    if (res.success) {
      setNewPin('');
      setConfirmPin('');
      setPasswordVerify('');
      setActiveTab('overview');
    }
  };

  const handleTogglePin = async (val: boolean) => {
    await togglePinRequirement(val);
  };

  const handleSetAutoLock = async (mins: number) => {
    await setAutoLockMinutes(mins);
  };

  const handleTerminateSessions = async () => {
    await terminateOtherSessions();
  };

  // Recent logs
  const logs: SecurityLogItem[] = currentUser.securityLogs || [
    {
      id: 'log-init',
      action: 'Account Active & Verified',
      actionBn: 'অ্যাকাউন্ট সুরক্ষিত ও সক্রিয়',
      timestamp: Date.now() - 3600000,
      date: new Date().toISOString().slice(0, 10),
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 40) : 'Web Session',
      status: 'success',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0A1128] border-t sm:border border-[#2A3A5C] rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#2A3A5C] bg-gradient-to-r from-[#14213D] via-[#1B2C52] to-[#0A1128] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-[#FCA311] flex items-center justify-center shadow-lg shadow-amber-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  {lang === 'bn' ? 'নিরাপত্তা ও গোপনীয়তা কেন্দ্র' : 'Security & Privacy Shield'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    AES-256
                  </span>
                </h2>
                <p className="text-[11px] text-[#B0BBD4]">
                  {lang === 'bn' ? 'আপনার অ্যাকাউন্টের নিরাপত্তা স্তর ও ট্রানজ্যাকশন পিন' : 'Account protection, PIN & session controls'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center gap-1 p-2 bg-[#050811] border-b border-[#2A3A5C] overflow-x-auto scrollbar-none text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-[#FCA311] text-black shadow-md'
                  : 'text-[#B0BBD4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সারসংক্ষেপ' : 'Overview'}</span>
            </button>

            <button
              onClick={() => setActiveTab('pin')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'pin'
                  ? 'bg-[#FCA311] text-black shadow-md'
                  : 'text-[#B0BBD4] hover:text-white hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ট্রানজ্যাকশন পিন' : 'Security PIN'}</span>
              {currentUser.securityPin && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'sessions'
                  ? 'bg-[#FCA311] text-black shadow-md'
                  : 'text-[#B0BBD4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সেশন ও ডিভাইস' : 'Sessions'}</span>
            </button>

            <button
              onClick={() => setActiveTab('autolock')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'autolock'
                  ? 'bg-[#FCA311] text-black shadow-md'
                  : 'text-[#B0BBD4] hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'অটো-লক' : 'Auto-Lock'}</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-[#FCA311] text-black shadow-md'
                  : 'text-[#B0BBD4] hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগ' : 'Audit Logs'}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Score Card */}
                <div className="p-4 rounded-2xl bg-[#14213D] border border-[#2A3A5C] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-[#FCA311]">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {lang === 'bn' ? 'নিরাপত্তা স্কোর' : 'Security Health Score'}
                        </h3>
                        <p className="text-[11px] text-[#B0BBD4]">
                          {score >= 80
                            ? (lang === 'bn' ? 'আপনার অ্যাকাউন্ট সর্বোচ্চ সুরক্ষিত' : 'Account is highly secure')
                            : (lang === 'bn' ? 'পিন সেট করে নিরাপত্তা আরও বাড়ান' : 'Boost security by setting a PIN')}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl border font-black text-sm ${getScoreColor(score)}`}>
                      {score}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-[#050811] rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full ${
                        score >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : score >= 50
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Security Checkpoints Checklist */}
                <div className="rounded-2xl bg-[#14213D] border border-[#2A3A5C] divide-y divide-white/5 overflow-hidden">
                  {/* Item 1: Security PIN */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentUser.securityPin ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-xs text-white">
                          {lang === 'bn' ? '৪ ডিজিট ট্রানজ্যাকশন পিন' : '4-Digit Transaction PIN'}
                        </p>
                        <p className="text-[10px] text-[#B0BBD4]">
                          {currentUser.securityPin
                            ? (lang === 'bn' ? 'সক্রিয় করা হয়েছে' : 'Configured & Active')
                            : (lang === 'bn' ? 'উত্তোলন ও ট্রান্সফারের সুরক্ষায় পিন সেট করুন' : 'Set PIN for withdrawal & transfer protection')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('pin')}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-[#FCA311]/15 text-[#FCA311] hover:bg-[#FCA311]/25 transition-colors"
                    >
                      {currentUser.securityPin ? (lang === 'bn' ? 'পরিবর্তন' : 'Manage') : (lang === 'bn' ? 'সেট করুন' : 'Setup')}
                    </button>
                  </div>

                  {/* Item 2: PIN Enforcement for Transfers */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentUser.isPinEnabled ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-xs text-white">
                          {lang === 'bn' ? 'উত্তোলনে পিন যাচাই' : 'Enforce PIN on Withdrawals'}
                        </p>
                        <p className="text-[10px] text-[#B0BBD4]">
                          {lang === 'bn' ? 'টাকা তোলার সময় বাধ্যতামূলক পিন চাইবে' : 'Mandatory PIN prompt on fund withdrawals'}
                        </p>
                      </div>
                    </div>
                    {currentUser.securityPin ? (
                      <button
                        onClick={() => handleTogglePin(!currentUser.isPinEnabled)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          currentUser.isPinEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {currentUser.isPinEnabled ? (lang === 'bn' ? 'চালু আছে' : 'Enabled') : (lang === 'bn' ? 'বন্ধ' : 'Disabled')}
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-500">{lang === 'bn' ? 'আগে পিন সেট করুন' : 'PIN Required'}</span>
                    )}
                  </div>

                  {/* Item 3: Auto-Lock */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-white">
                          {lang === 'bn' ? 'ইনঅ্যাক্টিভিটি অটো-লক' : 'Inactivity Auto-Lock'}
                        </p>
                        <p className="text-[10px] text-[#B0BBD4]">
                          {currentUser.autoLockMinutes && currentUser.autoLockMinutes > 0
                            ? `${currentUser.autoLockMinutes} ${lang === 'bn' ? 'মিনিট পর সুরক্ষিত' : 'minutes timeout'}`
                            : (lang === 'bn' ? 'অটো-লক নিষ্ক্রিয়' : 'Disabled')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('autolock')}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-colors"
                    >
                      {lang === 'bn' ? 'সেটিংস' : 'Configure'}
                    </button>
                  </div>

                  {/* Item 4: Encryption Status */}
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-white">
                          {lang === 'bn' ? 'ক্লাউড ফায়ারস্টোর এনক্রিপশন' : 'Cloud Firestore End-to-End SSL'}
                        </p>
                        <p className="text-[10px] text-[#B0BBD4]">
                          {lang === 'bn' ? 'TLS 1.3 ও Firebase নিরাপত্তা বিধিমালার আওতাভুক্ত' : 'Protected via TLS 1.3 & Firebase Security Rules'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PIN SETUP / MANAGE TAB */}
            {activeTab === 'pin' && (
              <form onSubmit={handleSavePin} className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    {lang === 'bn'
                      ? '৪ ডিজিটের ট্রানজ্যাকশন পিন আপনার উত্তোলন এবং ব্যালেন্স ট্রান্সফারের সময় অতিরিক্ত নিরাপত্তা প্রদান করে।'
                      : 'A 4-digit security PIN protects your withdrawals and P2P transfers from unauthorized actions.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">
                    {lang === 'bn' ? 'নতুন ৪ ডিজিটের পিন' : 'New 4-Digit Security PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-[#FCA311] focus:outline-none focus:border-[#FCA311]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">
                    {lang === 'bn' ? 'পিন নিশ্চিত করুন' : 'Confirm Security PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-[#FCA311] focus:outline-none focus:border-[#FCA311]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">
                    {lang === 'bn' ? 'বর্তমান অ্যাকাউন্ট পাসওয়ার্ড' : 'Current Account Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordVerify}
                      onChange={(e) => setPasswordVerify(e.target.value)}
                      placeholder={lang === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter account password'}
                      className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:border-[#FCA311]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPin || newPin.length !== 4 || confirmPin.length !== 4}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FCA311] to-amber-500 text-black font-black text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isSubmittingPin
                    ? (lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving PIN...')
                    : (lang === 'bn' ? 'নিরাপত্তা পিন সংরক্ষণ করুন' : 'Save Security PIN')}
                </button>
              </form>
            )}

            {/* SESSIONS & DEVICES TAB */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#14213D] border border-[#2A3A5C] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">
                          {lang === 'bn' ? 'বর্তমান ব্রাউজার ও ডিভাইস' : 'Current Active Device'}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {lang === 'bn' ? 'এই ডিভাইসে সক্রিয়' : 'This device (Active now)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1.5 text-[#B0BBD4] pt-2 border-t border-white/5 font-mono">
                    <p className="flex justify-between">
                      <span>Account ID:</span>
                      <span className="text-white font-bold">#{currentUser.id}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Phone:</span>
                      <span className="text-white font-bold">{currentUser.phone}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Encryption:</span>
                      <span className="text-emerald-400 font-bold">AES-256 / SSL Active</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Last Login:</span>
                      <span className="text-white">{currentUser.lastLoginTime ? new Date(currentUser.lastLoginTime).toLocaleString() : 'Recent'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTerminateSessions}
                  className="w-full py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অন্যান্য সকল ডিভাইস থেকে লগআউট করুন' : 'Log Out From All Other Devices'}</span>
                </button>
              </div>
            )}

            {/* AUTO-LOCK TAB */}
            {activeTab === 'autolock' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#14213D] border border-[#2A3A5C] space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-white text-xs">
                        {lang === 'bn' ? 'ইনঅ্যাক্টিভিটি স্বয়ংক্রিয় লক' : 'Inactivity Screen Auto-Lock'}
                      </h3>
                      <p className="text-[11px] text-[#B0BBD4]">
                        {lang === 'bn'
                          ? 'নির্দিষ্ট সময় কোনো কার্যকলাপ না থাকলে সেশন লক হয়ে যাবে।'
                          : 'Lock your session if no mouse or touch input is detected.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {[
                      { mins: 0, label: lang === 'bn' ? 'বন্ধ (Off)' : 'Disabled' },
                      { mins: 5, label: lang === 'bn' ? '৫ মিনিট' : '5 Minutes' },
                      { mins: 15, label: lang === 'bn' ? '১৫ মিনিট' : '15 Minutes' },
                      { mins: 30, label: lang === 'bn' ? '৩০ মিনিট' : '30 Minutes' },
                    ].map((opt) => (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => handleSetAutoLock(opt.mins)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          (currentUser.autoLockMinutes || 0) === opt.mins
                            ? 'bg-[#FCA311] text-black border-[#FCA311] shadow-lg shadow-amber-500/20'
                            : 'bg-[#050811] text-[#B0BBD4] border-[#2A3A5C] hover:border-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AUDIT LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-2.5">
                <p className="text-xs text-[#B0BBD4] font-semibold">
                  {lang === 'bn' ? 'সাম্প্রতিক নিরাপত্তা কার্যক্রম:' : 'Recent Security Activity Timeline:'}
                </p>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#14213D] border border-[#2A3A5C] flex items-start justify-between text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 ${
                            log.status === 'success'
                              ? 'bg-emerald-400'
                              : log.status === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        <div>
                          <p className="font-bold text-white">
                            {lang === 'bn' ? log.actionBn || log.action : log.action}
                          </p>
                          <p className="text-[10px] text-[#B0BBD4] font-mono">
                            {log.deviceInfo || 'Secure Client'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono shrink-0">
                        {log.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#050811] border-t border-[#2A3A5C] flex items-center justify-between text-xs text-[#B0BBD4]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              RJ TRUST Verified Shield
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
