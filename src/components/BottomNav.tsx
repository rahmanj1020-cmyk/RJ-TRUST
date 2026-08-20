import React from 'react';
import { Home, Crown, TrendingUp, Ticket, User as UserIcon, ReceiptText, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, t, isAdminLoggedIn } = useApp();

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'invest', label: t('invest'), icon: TrendingUp },
    { id: 'bond', label: t('bond'), icon: Ticket },
    { id: 'tx', label: 'TX', icon: ReceiptText },
    { id: 'account', label: t('account'), icon: UserIcon },
  ];

  if (isAdminLoggedIn) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b1120]/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 md:py-2 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
                isActive
                  ? 'text-[#FCA311] font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 bg-[#FCA311] rounded-full shadow-[0_0_8px_#FCA311]" />
              )}
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
