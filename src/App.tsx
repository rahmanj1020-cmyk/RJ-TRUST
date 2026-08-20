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
import { AccountTab } from './components/AccountTab';
import { TransactionsTab } from './components/TransactionsTab';
import { AdminDashboard } from './components/AdminDashboard';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { PlanDetailsModal } from './components/PlanDetailsModal';
import { SupportChatModal } from './components/SupportChatModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { InvestmentPlan } from './types';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, isAdminLoggedIn } = useApp();

  // Modal controls
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<InvestmentPlan | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceDefaultTab, setWorkspaceDefaultTab] = useState<'drive' | 'gmail'>('drive');

  const handleOpenWorkspace = (tab: 'drive' | 'gmail') => {
    setWorkspaceDefaultTab(tab);
    setWorkspaceModalOpen(true);
  };

  // If user is not logged in and not in admin mode, show Auth Screen
  if (!currentUser && !isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-white">
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
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col selection:bg-[#FCA311] selection:text-black">
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
            onOpenWorkspace={handleOpenWorkspace}
          />
        )}

        {activeTab === 'vip' && (
          <VipTab onSelectPlan={(plan) => setSelectedPlanForModal(plan)} />
        )}

        {activeTab === 'invest' && (
          <InvestTab onSelectPlan={(plan) => setSelectedPlanForModal(plan)} />
        )}

        {activeTab === 'bond' && <BondTab />}

        {activeTab === 'tx' && <TransactionsTab />}

        {activeTab === 'account' && (
          <AccountTab
            onOpenDeposit={() => setDepositOpen(true)}
            onOpenWithdraw={() => setWithdrawOpen(true)}
            onOpenChangePassword={() => setChangePasswordOpen(true)}
            onOpenWorkspace={handleOpenWorkspace}
          />
        )}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Chat Trigger button on mobile */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-gradient-to-tr from-[#FCA311] to-amber-300 text-black flex items-center justify-center shadow-2xl shadow-amber-500/40 active:scale-95 transition-all md:hidden"
        title="Chat Support"
      >
        <span className="text-xl">💬</span>
      </button>

      {/* Bottom Sticky Navigation */}
      <BottomNav />

      {/* Interactive Global Modals */}
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

      <GoogleWorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        defaultTab={workspaceDefaultTab}
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
