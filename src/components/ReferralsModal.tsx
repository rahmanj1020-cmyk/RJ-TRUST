import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Users, Gift, TrendingUp, Copy, Check, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User } from '../types';

interface ReferralsModalProps {
  onClose: () => void;
}

export const ReferralsModal: React.FC<ReferralsModalProps> = ({ onClose }) => {
  const { currentUser, users, transactions, t } = useApp();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!currentUser) return null;

  // Find 1st generation referrals
  const directReferrals = (Object.values(users) as User[]).filter(u => u.referredByPhone === currentUser.phone);
  
  // Calculate total commission from referral commissions and bonuses
  const referralTxs = transactions.filter(tx => 
    tx.userId === currentUser.phone && 
    (tx.type === 'referral_commission' || (tx.type === 'bonus' && tx.title.includes('Referral')))
  );
  const totalCommissionEarned = referralTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#14213D] border border-[#2A3A5C] rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2A3A5C] bg-[#0A1128]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCA311]/20 text-[#FCA311] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Referral Dashboard</h3>
              <p className="text-xs text-[#B0BBD4]">Invite & Earn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A1128] border border-[#2A3A5C] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-[#B0BBD4]">Total Referrals</span>
              </div>
              <div className="text-2xl font-black text-white">
                {directReferrals.length}
              </div>
            </div>
            
            <div className="bg-[#0A1128] border border-[#2A3A5C] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#2ed573]" />
                <span className="text-xs font-bold text-[#B0BBD4]">Total Earned</span>
              </div>
              <div className="text-2xl font-black text-white">
                ৳{totalCommissionEarned.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-gradient-to-r from-[#FCA311]/10 to-[#FCA311]/5 border border-[#FCA311]/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gift className="w-24 h-24" />
            </div>
            <h4 className="text-sm font-bold text-white mb-3">Your Referral Code</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-[#FCA311]/40 rounded-xl px-4 py-3 font-mono text-[#FCA311] font-bold text-lg tracking-wider">
                {currentUser.referralCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="h-[52px] px-5 rounded-xl bg-[#FCA311] hover:bg-amber-400 text-black font-extrabold active:scale-95 transition-all flex items-center gap-2"
              >
                {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#B0BBD4] mt-3">
              Share this code with your friends. When they register and invest, you will earn commissions up to 3 generations!
            </p>
          </div>

          {/* Direct Referrals List */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FCA311]" />
              Your Referrals (1st Gen)
            </h4>
            
            {directReferrals.length === 0 ? (
              <div className="text-center py-8 bg-[#0A1128] rounded-2xl border border-dashed border-[#2A3A5C]">
                <Gift className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-gray-400">You haven't referred anyone yet.</p>
                <p className="text-xs text-gray-500 mt-1">Share your code to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {directReferrals.map((user, idx) => (
                  <div key={user.id} className="bg-[#0A1128] border border-[#2A3A5C] rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#14213D] flex items-center justify-center font-black text-white text-sm border border-[#2A3A5C]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{user.fullName}</div>
                        <div className="text-xs text-[#B0BBD4]">Joined: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#2ed573]">
                        {user.activePlanIndex >= 0 ? 'Active Investor' : 'Registered'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
