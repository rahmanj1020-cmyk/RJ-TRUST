import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hashPassword } from '../utils/crypto';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, resetPassword, lang, showToast } = useApp();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hashedCurrent = await hashPassword(currentPass);
    if (currentPass !== currentUser.password && hashedCurrent !== currentUser.password) {
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

    const res = await resetPassword(currentUser.phone, currentUser.id, newPass, 'id');
    if (res.success) {
      handleClose();
    } else {
      showToast(res.message, 'error');
    }
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
                {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Account Password'}
              </h3>
            </div>
            <button onClick={handleClose} className="p-1 text-[#B0BBD4] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder={lang === 'bn' ? 'বর্তমান পাসওয়ার্ড দিন' : 'Enter current password'}
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <div className="border-t border-white/5 pt-3 mt-1">
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder={lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                {lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder={lang === 'bn' ? 'পুনরায় নতুন পাসওয়ার্ড দিন' : 'Re-enter new password'}
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all mt-2 cursor-pointer hover:brightness-105"
            >
              {lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
