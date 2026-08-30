import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, DollarSign, Crown, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Array of random Bangladeshi names for realism
const FAKE_NAMES = [
  "Rahim", "Karim", "Ayesha", "Fatima", "Hasan", "Sumaiya", "Rakib", "Sajid", 
  "Monir", "Tariq", "Salma", "Nazrul", "Habib", "Mehedi", "Tania", "Asif"
];

const FAKE_MESSAGES = [
  { type: 'referral', icon: Users, color: 'text-blue-400' },
  { type: 'commission', icon: DollarSign, color: 'text-green-400' },
  { type: 'upgrade', icon: Crown, color: 'text-[#FCA311]' },
  { type: 'bond', icon: Sparkles, color: 'text-purple-400' }
];

export const LiveActivityTicker: React.FC = () => {
  const { lang } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activity, setActivity] = useState<any>(null);

  const generateRandomActivity = () => {
    const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
    const phone = `01${Math.floor(Math.random() * 9 + 1)}***${Math.floor(Math.random() * 90 + 10)}`;
    const msgTemplate = FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];
    const amount = [50, 100, 200, 500, 1000, 5000][Math.floor(Math.random() * 6)];
    
    let bnText = '';
    let enText = '';

    if (msgTemplate.type === 'referral') {
      bnText = `${name} (${phone}) নতুন অ্যাকাউন্ট খুলেছেন!`;
      enText = `${name} (${phone}) just registered!`;
    } else if (msgTemplate.type === 'commission') {
      bnText = `${phone} রেফারেল বোনাস ৳${amount} পেয়েছেন!`;
      enText = `${phone} received ৳${amount} referral bonus!`;
    } else if (msgTemplate.type === 'upgrade') {
      bnText = `${name} VIP ${Math.floor(Math.random() * 5 + 1)} আপগ্রেড করেছেন!`;
      enText = `${name} just upgraded to VIP ${Math.floor(Math.random() * 5 + 1)}!`;
    } else {
      bnText = `${phone} একটি প্রাইজ বন্ড কিনেছেন!`;
      enText = `${phone} just purchased a Prize Bond!`;
    }

    return {
      id: Date.now(),
      text: lang === 'bn' ? bnText : enText,
      Icon: msgTemplate.icon,
      color: msgTemplate.color
    };
  };

  useEffect(() => {
    // Initial activity
    setActivity(generateRandomActivity());

    // Cycle activity every 4-7 seconds randomly
    const interval = setInterval(() => {
      setActivity(generateRandomActivity());
      setCurrentIndex((prev) => prev + 1);
    }, Math.floor(Math.random() * 3000) + 4000);

    return () => clearInterval(interval);
  }, [lang]);

  if (!activity) return null;

  const { Icon, text, color } = activity;

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#14213D] border border-[#2A3A5C] p-3 mb-4 shadow-lg flex items-center gap-3">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FCA311] to-transparent"></div>
      
      <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      
      <div className="flex-1 min-w-0 overflow-hidden relative h-5">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-0 flex items-center text-xs font-semibold text-white truncate"
          >
            {text}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        <span className="text-[9px] font-bold uppercase tracking-wider">Live</span>
      </div>
    </div>
  );
};
