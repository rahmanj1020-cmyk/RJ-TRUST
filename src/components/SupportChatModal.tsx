import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Headphones,
  PhoneCall,
  Sparkles,
  MessageSquare,
  Bot,
  TrendingUp,
  Coins,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORT_CONFIG } from '../data/constants';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({ isOpen, onClose }) => {
  const { chatMessages, sendChatMessage, isAiResponding, resetUnreadChat, t, lang, theme } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      resetUnreadChat();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages, isAiResponding]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiResponding) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const handleQuickSend = (q: string) => {
    if (isAiResponding) return;
    sendChatMessage(q);
  };

  const quickChips = [
    {
      label: lang === 'bn' ? '💳 ডিপোজিট নির্দেশিকা' : '💳 Deposit Guide',
      prompt: lang === 'bn' ? 'বিকাশ ও নগদে কীভাবে ডিপোজিট করতে হয়?' : 'How do I deposit via bKash/Nagad?',
      icon: MessageSquare,
    },
    {
      label: lang === 'bn' ? '💸 টাকা উত্তোলন নিয়ম' : '💸 Withdrawal Rules',
      prompt: lang === 'bn' ? 'টাকা উত্তোলনের নিয়ম এবং মিনিমাম লিমিট কত?' : 'What are the withdrawal rules and minimum limits?',
      icon: TrendingUp,
    },
    {
      label: lang === 'bn' ? '🏆 VIP প্ল্যান ও দৈনিক লাভ' : '🏆 VIP Plans & Daily Profit',
      prompt: lang === 'bn' ? 'RJ TRUST VIP প্ল্যান এবং প্রতিদিনের মুনাফা কত?' : 'Explain RJ TRUST VIP Plans and daily profits.',
      icon: Sparkles,
    },
    {
      label: lang === 'bn' ? '🎟️ প্রাইজ বন্ড সুবিধা' : '🎟️ Price Bond Features',
      prompt: lang === 'bn' ? 'RJ TRUST প্রাইজ বন্ড ড্র এবং মানিব্যাক গ্যারান্টি কীভাবে কাজ করে?' : 'How does the RJ TRUST Price Bond and refund guarantee work?',
      icon: ShieldCheck,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`border-t sm:border rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[88vh] sm:h-[680px] shadow-2xl flex flex-col overflow-hidden ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#0A1128] border-[#2A3A5C] text-white'
          }`}
        >
          {/* Chat Header */}
          <div
            className={`p-4 border-b flex items-center justify-between ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#14213D] border-[#2A3A5C]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FCA311] to-[#e0900a] text-black flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                <Headphones className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>
                    RJ Support & Assistant
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    24/7 Live
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-[#B0BBD4] font-medium">
                  {lang === 'bn' ? 'তাৎক্ষণিক গ্রাহক সেবা ও সহায়তা' : 'Instant Customer Help & Live Guidance'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={SUPPORT_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-all"
                title="WhatsApp Hotline: 01410809337"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Question Chips */}
          <div
            className={`px-3 py-2 border-b flex items-center gap-2 overflow-x-auto no-scrollbar ${
              theme === 'light' ? 'bg-slate-100/70 border-slate-200' : 'bg-black/30 border-white/5'
            }`}
          >
            {quickChips.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickSend(chip.prompt)}
                  disabled={isAiResponding}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 border shrink-0 ${
                    theme === 'light'
                      ? 'bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-800 shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 border-[#2A3A5C] text-amber-200 hover:text-[#FCA311]'
                  }`}
                >
                  <Icon className="w-3 h-3 text-[#FCA311]" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Thread */}
          <div
            className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${
              theme === 'light' ? 'bg-slate-50' : 'bg-[#050811]'
            }`}
          >
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black font-semibold rounded-tr-none shadow-md shadow-amber-500/10'
                        : theme === 'light'
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-md'
                        : 'bg-[#14213D] text-white border border-[#2A3A5C] rounded-tl-none shadow-lg'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#FCA311] font-bold mb-1 pb-1 border-b border-white/5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>RJ Support Assistant</span>
                      </div>
                    )}

                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className={`mt-2 pt-2 border-t space-y-1 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#FCA311]">
                          <Sparkles className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'তথ্যসূত্র' : 'Sources'}</span>
                        </div>
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block text-[10px] truncate hover:underline ${
                              theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                            }`}
                          >
                            {idx + 1}. {s.title || s.uri}
                          </a>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        isUser
                          ? 'text-black/60 font-medium'
                          : theme === 'light'
                          ? 'text-slate-400'
                          : 'text-[#B0BBD4]'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {isAiResponding && (
              <div className="flex justify-start">
                <div
                  className={`p-3.5 rounded-2xl text-xs rounded-tl-none flex items-center gap-2.5 border ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-700 shadow-md'
                      : 'bg-[#14213D] border-[#2A3A5C] text-slate-200'
                  }`}
                >
                  <Loader2 className="w-4 h-4 text-[#FCA311] animate-spin" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-[#FCA311]">
                      {lang === 'bn' ? 'সহায়তা উত্তর প্রস্তুত হচ্ছে...' : 'Formulating response...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSend}
            className={`p-3 border-t flex items-center gap-2 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#14213D] border-[#2A3A5C]'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAiResponding}
              placeholder={
                lang === 'bn'
                  ? 'আপনার প্রশ্ন লিখুন (যেমন: ডিপোজিট, উইথড্র, প্ল্যান)...'
                  : 'Ask about deposit, withdrawal, VIP plans, bonds...'
              }
              className={`flex-1 border rounded-full px-4 py-2.5 text-xs placeholder-gray-400 focus:outline-none focus:border-[#FCA311] transition-colors ${
                theme === 'light'
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-[#0A1128] border-[#2A3A5C] text-white'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isAiResponding}
              className="w-10 h-10 rounded-full bg-[#FCA311] hover:bg-amber-400 disabled:opacity-50 text-black flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {isAiResponding ? (
                <Loader2 className="w-4 h-4 text-black animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-black" />
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
