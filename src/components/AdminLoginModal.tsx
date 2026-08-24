import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, ArrowRight, Eye, EyeOff, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { adminLogin, t, lang, showToast } = useApp();
  const [adminIdInput, setAdminIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminIdInput.trim()) {
      showToast(lang === 'bn' ? 'অ্যাডমিন আইডি দিন' : 'Please enter Admin ID', 'error');
      return;
    }
    if (!password) {
      showToast(lang === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড দিন' : 'Please enter Admin password', 'error');
      return;
    }
    const res = await adminLogin(adminIdInput, password);
    if (res.success) {
      onClose();
      setAdminIdInput('');
      setPassword('');
      setShowPassword(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0b1120] border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  {t('adminLogin')}
                </h3>
                <p className="text-[10px] text-amber-400 font-bold">Authorized Access Only</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Restricted master administration portal. Please verify your administrator credentials to proceed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Admin ID field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('enterAdminId')}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={adminIdInput}
                  onChange={(e) => setAdminIdInput(e.target.value)}
                  placeholder="Master Admin ID"
                  autoFocus
                  className="w-full bg-[#05070a] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Admin Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('enterAdminPw')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Master administrator password"
                  className="w-full bg-[#05070a] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>{t('enter')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
