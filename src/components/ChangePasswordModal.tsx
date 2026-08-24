import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, KeyRound, Mail, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, resetPassword, lang, showToast } = useApp();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  // Email OTP state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSendOtp = () => {
    if (!email || !email.includes('@')) {
      showToast(lang === 'bn' ? 'সঠিক ইমেইল ঠিকানা দিন' : 'Please enter a valid email address', 'error');
      return;
    }
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setIsOtpSent(true);
    // In a real app, this would trigger a backend API to send an email. 
    // For demo purposes, we show it in the toast.
    showToast(`OTP sent to ${email} (Demo: ${newOtp})`, 'success');
  };

  const handleClose = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setEmail('');
    setOtp('');
    setIsOtpSent(false);
    setGeneratedOtp('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== currentUser.password) {
      showToast(lang === 'bn' ? 'বর্তমান পাসওয়ার্ড সঠিক নয়' : 'Current password incorrect', 'error');
      return;
    }
    if (!newPass || newPass.length < 6) {
      showToast(lang === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'New password must be at least 6 chars', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      showToast(lang === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না' : 'Passwords do not match', 'error');
      return;
    }
    if (!isOtpSent) {
      showToast(lang === 'bn' ? 'প্রথমে OTP পাঠান' : 'Please send OTP first', 'error');
      return;
    }
    if (otp !== generatedOtp) {
      showToast(lang === 'bn' ? 'OTP ভুল' : 'Invalid OTP entered', 'error');
      return;
    }

    resetPassword(currentUser.phone, currentUser.id, newPass);
    handleClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl max-w-sm w-full p-6 shadow-2xl my-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#FCA311]" />
              <h3 className="font-extrabold text-sm text-white">
                Change Account Password
              </h3>
            </div>
            <button onClick={handleClose} className="p-1 text-[#B0BBD4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <div className="border-t border-white/5 pt-3 mt-1">
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                Email Address (For OTP Verification)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isOtpSent}
                    placeholder="Enter email to receive OTP"
                    className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311] disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isOtpSent}
                  className="px-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {isOtpSent ? <CheckCircle2 className="w-4 h-4" /> : 'Send'}
                </button>
              </div>
            </div>

            {isOtpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Enter 6-Digit Email OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={6}
                  className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311] tracking-widest text-center font-mono"
                />
              </motion.div>
            )}

            <div className="border-t border-white/5 pt-3 mt-1">
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all mt-2"
            >
              Update Password
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
