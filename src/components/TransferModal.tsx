import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, transferFunds, showToast, lang } = useApp();
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!receiver || isNaN(numAmount) || numAmount <= 0) return;
    
    const res = transferFunds(receiver, numAmount, password);
    if (res.success) {
      showToast(res.message, 'success');
      setReceiver('');
      setAmount('');
      setPassword('');
      onClose();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-[#0A1128] border-t sm:border border-[#2A3A5C] rounded-t-3xl sm:rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-[#2A3A5C] flex items-center justify-between bg-[#14213D]">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-500" />
              P2P Transfer
            </h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>2% Admin fee will be deducted from the transferred amount. Receiver gets the net amount.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">Receiver Account ID / Phone Number</label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="e.g. 017XXXXXX or 9-digit ID"
                className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FCA311]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">Amount (BDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FCA311]"
                required
              />
            </div>

            
            <div>
              <label className="block text-[11px] font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">Account Password / PIN</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FCA311]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FCA311] via-amber-400 to-[#e0900a] text-black font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              Transfer Now
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
