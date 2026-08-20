import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Headphones, PhoneCall, Sparkles, MessageSquare, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORT_CONFIG } from '../data/constants';

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({ isOpen, onClose }) => {
  const { chatMessages, sendChatMessage, resetUnreadChat, t, lang } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      resetUnreadChat();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const quickQuestions = [
    'How to Deposit?',
    'Withdrawal Rules & Fee',
    'Price Bonds Explained',
    'Referral Commission System',
    'Contact WhatsApp Hotline',
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="bg-[#0A1128] border-t sm:border border-[#2A3A5C] rounded-t-3xl sm:rounded-3xl max-w-md w-full h-[85vh] sm:h-[650px] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Chat Header */}
          <div className="p-4 bg-[#14213D] border-b border-[#2A3A5C] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FCA311] to-[#e0900a] text-black flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>RJ Customer Concierge</span>
                  <span className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
                </h3>
                <p className="text-[11px] text-[#2ed573] font-semibold">{t('online')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={SUPPORT_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                title="WhatsApp 01410809337"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <button onClick={onClose} className="p-1 text-[#B0BBD4] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick FAQ Chips */}
          <div className="px-3 py-2 bg-black/40 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => sendChatMessage(q)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-[#2A3A5C] text-[11px] font-bold text-amber-200 whitespace-nowrap active:scale-95 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#050811]">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black font-semibold rounded-tr-none shadow-md shadow-amber-500/10'
                        : 'bg-[#14213D] text-white border border-[#2A3A5C] rounded-tl-none shadow-lg'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1 text-[10px] text-[#FCA311] font-bold mb-1">
                        <Bot className="w-3 h-3" />
                        <span>RJ Support</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        isUser ? 'text-black/60 font-medium' : 'text-[#B0BBD4]'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 bg-[#14213D] border-t border-[#2A3A5C] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('typeMessage')}
              className="flex-1 bg-[#0A1128] border border-[#2A3A5C] rounded-full px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-[#FCA311] hover:bg-amber-400 text-black flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-md shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
