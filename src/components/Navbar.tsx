import React from 'react';
import { MessageSquare, LogOut, Shield, Globe, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenChat: () => void;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChat, onOpenAdminLogin }) => {
  const { currentUser, lang, setLang, logout, isAdminLoggedIn, setActiveTab, unreadChatCount } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#0b1120]/90 border-b border-slate-800/80 backdrop-blur-xl px-4 py-3 shadow-lg shadow-black/40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#FCA311] via-[#e0900a] to-[#14213D] p-[1.5px] shadow-lg shadow-[#FCA311]/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#05070a] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-[#FCA311] via-amber-200 to-[#FCA311] bg-clip-text text-transparent">
                RJ
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider bg-gradient-to-r from-[#FCA311] via-amber-100 to-[#FCA311] bg-clip-text text-transparent">
                RJ TRUST
              </span>
            </div>
            <span className="text-[9px] tracking-widest text-slate-400 uppercase font-bold">
              TRUST • GROW • INFINITE
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="px-2.5 py-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-xs font-bold text-[#FCA311] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Toggle Language (বাং / EN)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Support Chat Button with Badge */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-[#FCA311] transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Customer Support Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Admin Panel button */}
          {isAdminLoggedIn ? (
            <button
              onClick={() => setActiveTab('admin')}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/30 active:scale-95 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Admin Portal"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Logout button */}
          {currentUser && (
            <button
              onClick={logout}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all active:scale-95 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
