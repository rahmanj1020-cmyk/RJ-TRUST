import { SUPPORT_CONFIG } from './data/constants';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Toast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { HomeTab } from './components/HomeTab';
import { VipTab } from './components/VipTab';
import { InvestTab } from './components/InvestTab';
import { BondTab } from './components/BondTab';
import { FDTab } from './components/FDTab';
import { AccountTab } from './components/AccountTab';
import { TransactionsTab } from './components/TransactionsTab';
import { AdminDashboard } from './components/AdminDashboard';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { PlanDetailsModal } from './components/PlanDetailsModal';
import { TransferModal } from './components/TransferModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SupportChatModal } from './components/SupportChatModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { SecurityCenterModal } from './components/SecurityCenterModal';
import { InvestmentPlan } from './types';
import { useSEO } from './utils/useSEO';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, isAdminLoggedIn, theme, lang, isSecurityModalOpen, setIsSecurityModalOpen } = useApp();

  // Dynamic SEO handler
  useSEO({
    activeTab,
    lang,
    isLoggedIn: !!currentUser,
    isAdmin: isAdminLoggedIn,
  });

  // Modal controls
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<InvestmentPlan | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenLeaderboard = () => setLeaderboardOpen(true);
    window.addEventListener('openLeaderboardModal', handleOpenLeaderboard);
    return () => window.removeEventListener('openLeaderboardModal', handleOpenLeaderboard);
  }, []);

  React.useEffect(() => {
    const handleOpen = () => setTransferOpen(true);
    window.addEventListener('openTransferModal', handleOpen);
    return () => window.removeEventListener('openTransferModal', handleOpen);
  }, []);

  // If user is not logged in and not in admin mode, show Auth Screen
  if (!currentUser && !isAdminLoggedIn) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-black text-white'}`}>
        <Toast />
        <AuthScreen
          onOpenForgotPassword={() => setForgotPasswordOpen(true)}
          onOpenAdminLogin={() => setAdminLoginOpen(true)}
        />
        <ForgotPasswordModal
          isOpen={forgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
        />
        <AdminLoginModal
          isOpen={adminLoginOpen}
          onClose={() => setAdminLoginOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#05070a] text-slate-100'} flex flex-col selection:bg-[#FCA311] selection:text-black`}>
      <Toast />

      {/* Top Header */}
      <Navbar
        onOpenChat={() => setChatOpen(true)}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 p-3.5 md:p-6 max-w-5xl w-full mx-auto">
        {activeTab === 'home' && (
          <HomeTab
            onOpenDeposit={() => setDepositOpen(true)}
            onOpenWithdraw={() => setWithdrawOpen(true)}
          />
        )}

        {activeTab === 'vip' && (
          <VipTab onSelectPlan={(plan) => setSelectedPlanForModal(plan)} />
        )}

        {activeTab === 'invest' && (
          <InvestTab onSelectPlan={(plan) => setSelectedPlanForModal(plan)} />
        )}

        {activeTab === 'fd' && <FDTab />}
        {activeTab === 'bond' && <BondTab />}

        {activeTab === 'tx' && <TransactionsTab />}

        {activeTab === 'account' && (
          <AccountTab
            onOpenDeposit={() => setDepositOpen(true)}
            onOpenWithdraw={() => setWithdrawOpen(true)}
            onOpenChangePassword={() => setChangePasswordOpen(true)}
          />
        )}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Chat & AI WhatsApp Agent Buttons */}
      <div className="fixed bottom-20 md:bottom-8 right-4 z-40 flex flex-col items-center gap-3">
        {/* AI WhatsApp Agent */}
        <a
          href={SUPPORT_CONFIG.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all group relative"
          title="AI WhatsApp Support Agent"
        >
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          {/* Status Dot */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-pulse"></span>
          
          <div className="absolute right-full mr-3 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
            Chat with AI Agent
            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-white transform rotate-45"></div>
          </div>
        </a>

        {/* Internal Chat Trigger */}
        <button
          onClick={() => setChatOpen(true)}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-[#FCA311] to-amber-300 text-black flex items-center justify-center shadow-2xl shadow-amber-500/40 active:scale-95 transition-all md:hidden group relative"
          title="App Support"
        >
          <span className="text-lg">💬</span>
        </button>
      </div>

      {/* Bottom Sticky Navigation */}
      <BottomNav />

      {/* Interactive Global Modals */}
      <TransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} />
      <LeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />

      <PlanDetailsModal
        plan={selectedPlanForModal}
        onClose={() => setSelectedPlanForModal(null)}
      />

      <SupportChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
      />

      <SecurityCenterModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
