import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound, Phone, ShieldCheck, Lock, ArrowRight, CheckCircle2, User as UserIcon, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { users, resetPassword, lang, showToast } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [verifyMethod, setVerifyMethod] = useState<'id' | 'name' | 'otp'>('id');
  const [phone, setPhone] = useState('');
  const [verifyValue, setVerifyValue] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      showToast(lang === 'bn' ? 'প্রথমে ফোন নম্বর লিখুন' : 'Please enter phone number first', 'error');
      return;
    }
    const user = users[cleanPhone];
    if (!user) {
      showToast(lang === 'bn' ? 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই' : 'No account found with this phone', 'error');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setVerifyValue(code);
    showToast(
      lang === 'bn'
        ? `ভেরিফিকেশন কোড: ${code} (স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে)`
        : `SMS OTP: ${code} (Auto-filled)`,
      'info'
    );
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanVal = verifyValue.trim().toLowerCase();
    const user = users[cleanPhone];

    if (!user) {
      showToast(lang === 'bn' ? 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই' : 'No account found with this phone', 'error');
      return;
    }

    if (verifyMethod === 'id') {
      if (user.id.toLowerCase() !== cleanVal) {
        showToast(lang === 'bn' ? 'অ্যাকাউন্ট ID সঠিক নয়' : 'Incorrect 9-digit Account ID', 'error');
        return;
      }
    } else if (verifyMethod === 'name') {
      if (user.fullName.toLowerCase() !== cleanVal) {
        showToast(lang === 'bn' ? 'নিবন্ধিত নাম মিলছে না' : 'Registered Full Name does not match', 'error');
        return;
      }
    } else if (verifyMethod === 'otp') {
      if (!cleanVal || (generatedOtp && cleanVal !== generatedOtp)) {
        showToast(lang === 'bn' ? 'ভুল ওটিপি কোড' : 'Incorrect OTP code', 'error');
        return;
      }
    }

    setStep(2);
    showToast(lang === 'bn' ? 'যাচাই সফল! নতুন পাসওয়ার্ড দিন।' : 'Identity verified! Set your new password.', 'success');
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 chars', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(lang === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না' : 'Passwords do not match', 'error');
      return;
    }

    const res = resetPassword(phone, verifyValue, newPassword, verifyMethod);
    if (res.success) {
      onClose();
      setStep(1);
      setPhone('');
      setVerifyValue('');
      setGeneratedOtp(null);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl max-w-sm w-full p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#FCA311]" />
              <h3 className="font-extrabold text-sm text-white">
                Password Recovery
              </h3>
            </div>
            <button onClick={onClose} className="p-1 text-[#B0BBD4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 1 ? (
            <form onSubmit={handleVerify} className="space-y-3.5">
              {/* Method switch tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#0A1128] p-1 rounded-2xl border border-white/5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('id');
                    setVerifyValue('');
                  }}
                  className={`py-1.5 rounded-xl transition-all ${
                    verifyMethod === 'id'
                      ? 'bg-[#FCA311] text-black font-extrabold'
                      : 'text-[#B0BBD4] hover:text-white'
                  }`}
                >
                  Account ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('name');
                    setVerifyValue('');
                  }}
                  className={`py-1.5 rounded-xl transition-all ${
                    verifyMethod === 'name'
                      ? 'bg-[#FCA311] text-black font-extrabold'
                      : 'text-[#B0BBD4] hover:text-white'
                  }`}
                >
                  Full Name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMethod('otp');
                    setVerifyValue('');
                  }}
                  className={`py-1.5 rounded-xl transition-all ${
                    verifyMethod === 'otp'
                      ? 'bg-[#FCA311] text-black font-extrabold'
                      : 'text-[#B0BBD4] hover:text-white'
                  }`}
                >
                  SMS OTP
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Registered Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                  />
                </div>
              </div>

              {verifyMethod === 'id' && (
                <div>
                  <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                    9-Digit Account ID
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={verifyValue}
                      onChange={(e) => setVerifyValue(e.target.value)}
                      placeholder="e.g. 849201934"
                      className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#FCA311]"
                    />
                  </div>
                </div>
              )}

              {verifyMethod === 'name' && (
                <div>
                  <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                    Registered Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={verifyValue}
                      onChange={(e) => setVerifyValue(e.target.value)}
                      placeholder="e.g. Mohammad Rahim"
                      className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                    />
                  </div>
                </div>
              )}

              {verifyMethod === 'otp' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#B0BBD4]">
                      6-Digit Security OTP
                    </label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[11px] text-[#FCA311] hover:underline font-bold"
                    >
                      Send / Get Code
                    </button>
                  </div>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={verifyValue}
                      onChange={(e) => setVerifyValue(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#FCA311]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Verify & Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-3.5">
              <p className="text-xs text-[#2ed573] font-bold">
                Identity verified! Please create your new secure password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2ed573] to-emerald-500 text-black font-black text-xs shadow-lg active:scale-95 transition-all"
              >
                Save New Password & Login
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
