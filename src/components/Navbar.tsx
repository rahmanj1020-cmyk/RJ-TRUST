import React, { useState } from 'react';
import { MessageSquare, LogOut, Shield, Globe, Bell, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenChat: () => void;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenChat, onOpenAdminLogin }) => {
  const { currentUser, lang, setLang, logout, isAdminLoggedIn, setActiveTab, unreadChatCount, markNotificationRead } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);

  const notifications = currentUser?.notifications || [];
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

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
            className="hidden sm:flex px-2.5 py-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-xs font-bold text-[#FCA311] items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
          </button>
          
          {/* Notifications */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-[#FCA311] transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FCA311] text-black rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-72 max-h-[80vh] overflow-y-auto bg-[#14213D] border border-[#2A3A5C] rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-2">
                    <div className="px-3 py-2 border-b border-[#2A3A5C] flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 rounded-xl border ${n.read ? 'bg-[#0A1128]/50 border-transparent' : 'bg-[#0A1128] border-amber-500/30'} flex items-start gap-3 transition-colors`}
                          onClick={() => {
                            if (!n.read) markNotificationRead(n.id);
                          }}
                        >
                          <div className={`mt-0.5 shrink-0 ${n.read ? 'text-slate-500' : 'text-amber-400'}`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-xs font-bold ${n.read ? 'text-slate-300' : 'text-white'}`}>{n.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                            <span className="text-[9px] text-slate-500 mt-1 block">{n.date}</span>
                          </div>
                          {!n.read && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }}
                              className="text-amber-500 hover:text-amber-400 p-1"
                              title="Mark as read"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

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
              className="hidden md:flex p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 hover:text-amber-300 transition-all active:scale-95 cursor-pointer shadow-sm"
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
