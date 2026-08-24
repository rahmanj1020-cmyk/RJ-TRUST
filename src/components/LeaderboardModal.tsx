import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Medal, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { users } = useApp();
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Sort users by totalInvested + totalWithdrawn or just balance for demo
      const allUsers = Object.values(users).filter((u: any) => u.phone !== 'admin');
      allUsers.sort((a: any, b: any) => {
        // Primary metric: total invested + referral count weight
        const aScore = a.totalInvested + (a.referralCount * 500);
        const bScore = b.totalInvested + (b.referralCount * 500);
        return bScore - aScore;
      });
      setTopUsers(allUsers.slice(0, 10));
    }
  }, [isOpen, users]);

  if (!isOpen) return null;

  const getMaskedPhone = (phone: string) => {
    if (phone.length < 11) return phone;
    return phone.substring(0, 4) + '***' + phone.substring(8);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-[#0A1128] border-t sm:border border-[#2A3A5C] rounded-t-3xl sm:rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="p-4 border-b border-[#2A3A5C] flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-[#14213D]">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Investors Leaderboard
            </h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto space-y-2">
            {topUsers.map((user, idx) => (
              <div 
                key={user.id} 
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  idx === 0 ? 'bg-amber-500/10 border-amber-500/30' : 
                  idx === 1 ? 'bg-slate-300/10 border-slate-300/30' : 
                  idx === 2 ? 'bg-orange-700/10 border-orange-700/30' : 
                  'bg-[#14213D] border-[#2A3A5C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black shadow-md ${
                    idx === 0 ? 'bg-amber-400 text-black' : 
                    idx === 1 ? 'bg-slate-300 text-black' : 
                    idx === 2 ? 'bg-orange-600 text-black' : 
                    'bg-[#0A1128] text-slate-400'
                  }`}>
                    {idx < 3 ? <Medal className="w-4 h-4" /> : `#${idx + 1}`}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wider">{getMaskedPhone(user.phone)}</h4>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" /> 
                      {user.referralCount} Referrals
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[#2ed573]">৳{user.totalInvested.toLocaleString()}</div>
                  <div className="text-[9px] text-gray-500">Invested</div>
                </div>
              </div>
            ))}
            {topUsers.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">No data available yet.</div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
