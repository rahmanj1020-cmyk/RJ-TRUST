import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Phone, User as UserIcon, UserPlus, LogIn, KeyRound, Sparkles, Shield, ArrowRight, CheckCircle2, Gift } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthScreenProps {
  onOpenForgotPassword: () => void;
  onOpenAdminLogin: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenForgotPassword, onOpenAdminLogin }) => {
  const { login, register, lang, setLang, t, showToast } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [isFromRefLink, setIsFromRefLink] = useState(false);

  const [loading, setLoading] = useState(false);

  // Auto-detect referral code from URL query parameter (e.g. ?ref=RJ1234 or #ref=RJ1234)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let ref = urlParams.get('ref') || urlParams.get('r') || urlParams.get('invite');

      if (!ref && window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          ref = hashParams.get('ref') || hashParams.get('r');
        }
      }

      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        setRegReferralCode(cleanRef);
        setIsFromRefLink(true);
        setTab('register');
        showToast(
          lang === 'bn' ? `রেফারেল কোড (${cleanRef}) প্রয়োগ করা হয়েছে!` : `Referral code (${cleanRef}) applied!`,
          'info'
        );
      }
    } catch (e) {
      console.warn('Could not parse ref from URL', e);
    }
  }, [lang]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) {
      showToast(lang === 'bn' ? 'ফোন নম্বর ও পাসওয়ার্ড দিন' : 'Enter phone and password', 'error');
      return;
    }
    setLoading(true);
    const res = login(loginPhone, loginPassword);
    setLoading(false);
    if (!res.success) {
      showToast(res.message, 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = register(regFullName, regPhone, regPassword, regReferralCode);
    setLoading(false);
    if (!res.success) {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#0A1128] to-black px-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FCA311]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#14213D]/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Language Switcher Float */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-[#2A3A5C] text-xs font-bold text-[#FCA311] transition-all"
        >
          {lang === 'bn' ? 'English (EN)' : 'বাংলা (বাং)'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FCA311] via-[#e0900a] to-[#14213D] p-[2px] shadow-2xl shadow-amber-500/30 mb-3.5">
            <div className="w-full h-full bg-[#050811] rounded-[14px] flex items-center justify-center">
              <span className="font-black text-2xl tracking-widest bg-gradient-to-r from-[#FCA311] via-amber-200 to-[#FCA311] bg-clip-text text-transparent">
                RJ
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-wider">
            <span className="bg-gradient-to-r from-[#FCA311] via-amber-200 to-[#e0900a] bg-clip-text text-transparent">
              RJ TRUST
            </span>
          </h1>
          <p className="text-xs font-bold tracking-[0.25em] text-[#B0BBD4] uppercase mt-1">
            TRUST • GROW • INFINITE
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#FCA311] to-transparent mx-auto mt-3 rounded-full" />
        </div>

        {/* Auth Card */}
        <div className="bg-[#14213D]/80 border border-[#2A3A5C] rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-[#0A1128] p-1 rounded-2xl mb-6 border border-[#2A3A5C]/40">
            <button
              onClick={() => setTab('login')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black shadow-lg shadow-amber-500/20'
                  : 'text-[#B0BBD4] hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{t('login')}</span>
            </button>
            <button
              onClick={() => setTab('register')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black shadow-lg shadow-amber-500/20'
                  : 'text-[#B0BBD4] hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('register')}</span>
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1.5">
                  {t('phone')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1.5">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer mt-2"
              >
                {loading ? 'Logging in...' : t('login')}
              </button>

              <div className="flex items-center justify-between text-xs text-[#B0BBD4] pt-2">
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="hover:text-[#FCA311] font-semibold transition-colors flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#FCA311]" />
                  <span>{t('forgotPw')}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="hover:text-[#FCA311] font-semibold transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('adminAccess')}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Mohammad Rahim"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  {t('phone')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#B0BBD4]">
                    {t('refOptional')}
                  </label>
                  {isFromRefLink && (
                    <span className="text-[10px] text-[#2ed573] font-bold flex items-center gap-1 bg-[#2ed573]/10 px-2 py-0.5 rounded-md border border-[#2ed573]/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'রেফারেল লিংক থেকে যুক্ত' : 'Applied via Referral Link'}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                  <input
                    type="text"
                    value={regReferralCode}
                    onChange={(e) => setRegReferralCode(e.target.value)}
                    placeholder="e.g. MO2233"
                    className={`w-full bg-[#0A1128] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all uppercase ${
                      isFromRefLink ? 'border-[#2ed573] ring-1 ring-[#2ed573]/40' : 'border-[#2A3A5C] focus:border-[#FCA311]'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer mt-2"
              >
                {loading ? 'Creating...' : t('register')}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
