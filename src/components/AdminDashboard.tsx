import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, Search, Gift, Trophy, RefreshCw, KeyRound, LogOut, DollarSign, AlertCircle, Sparkles, Trash2, LineChart, Activity, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RJ_BONDS, RJ_PLANS } from '../data/constants';
import { User, RequestItem } from '../types';
import { AdminCharts } from './AdminCharts';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    requests,
    transactions,
    approveRequest,
    rejectRequest,
    adminDeleteRequest,
    adminDeleteUser,
    awardBondPrize,
    refundBond,
    executeBondDraw,
    adminAdjustBalance,
    adminId,
    adminChangeCredentials,
    adminLogout,
    showToast,
    lang,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'pending' | 'approved' | 'rejected' | 'users' | 'bonds' | 'settings'>('analytics');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [bondSearchQuery, setBondSearchQuery] = useState('');
  const [selectedBondCategory, setSelectedBondCategory] = useState('b100');

  // Balance adjustment modal state
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustNote, setAdjustNote] = useState<string>('Bonus / Correction');

  // Delete user confirmation state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Admin credentials change state
  const [newAdminIdState, setNewAdminIdState] = useState(adminId || 'admin');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');

  // Stats calculation
  const totalUsersCount = Object.keys(users).length;
  const allUsersList = Object.values(users) as User[];
  const activeInvestorsCount = allUsersList.filter((u) => u.activePlanIndex >= 0).length;

  const totalDeposits = requests
    .filter((r) => r.type === 'deposit' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalWithdrawals = requests
    .filter((r) => r.type === 'withdrawal' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num === 0) {
      showToast('Enter valid non-zero amount', 'error');
      return;
    }
    adminAdjustBalance(adjustingUser.phone, num, adjustNote);
    setAdjustingUser(null);
    setAdjustAmount('');
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminIdState.trim() || newAdminIdState.trim().length < 3) {
      showToast('Admin ID must be at least 3 characters', 'error');
      return;
    }
    if (!newAdminPass || newAdminPass.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      showToast('Passwords do not match', 'error');
      return;
    }
    const res = adminChangeCredentials(newAdminIdState, newAdminPass);
    if (res.success) {
      setNewAdminPass('');
      setConfirmAdminPass('');
    }
  };

  // Search users
  const filteredUsers = allUsersList.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.phone.includes(q) || u.id.includes(q) || u.referralCode.toLowerCase().includes(q);
  });

  // Collect all bonds
  const allBondsList: { user: User; bond: any }[] = [];
  allUsersList.forEach((u) => {
    (u.bonds || []).forEach((b) => {
      if (b.bondDefId === selectedBondCategory) {
        allBondsList.push({ user: u, bond: b });
      }
    });
  });

  // Search bond by serial
  let searchedBondResult: { user: User; bond: any } | null = null;
  if (bondSearchQuery.trim()) {
    const q = bondSearchQuery.trim().toUpperCase();
    allUsersList.forEach((u) => {
      (u.bonds || []).forEach((b) => {
        if (b.serialNumber === q) {
          searchedBondResult = { user: u, bond: b };
        }
      });
    });
  }

  const selectedBondDef = RJ_BONDS.find((b) => b.id === selectedBondCategory) || RJ_BONDS[0];

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Top Admin Header */}
      <div className="bg-[#0A1128] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Master Admin Control Center</span>
            </h2>
            <p className="text-xs text-[#B0BBD4]">Full Management, Approvals, Lottery & Ledgers</p>
          </div>
        </div>

        <button
          onClick={adminLogout}
          className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-[#FCA311]">{totalUsersCount}</div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-1">
            Total Users
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-[#2ed573]">{activeInvestorsCount}</div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-1">
            Active Investors
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 text-center">
          <div className="text-lg md:text-xl font-black text-[#FCA311]">
            ৳{totalDeposits.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-1">
            Total Deposits
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 text-center">
          <div className="text-lg md:text-xl font-black text-red-400">
            ৳{totalWithdrawals.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-1">
            Total Withdrawals
          </div>
        </div>
      </div>

      {/* Admin Subtabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Analytics & Charts</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'pending'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <span>Pending Approvals</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('approved')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'approved'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <span>Approved ({approvedRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rejected')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'rejected'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <span>Rejected ({rejectedRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <span>Users ({totalUsersCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bonds')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'bonds'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <span>Bond Lottery & Prizes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <span>Settings</span>
        </button>
      </div>

      {/* Tab: Analytics & Growth Charts */}
      {activeSubTab === 'analytics' && (
        <AdminCharts users={users} requests={requests} transactions={transactions} />
      )}

      {/* Tab: Pending Requests */}
      {activeSubTab === 'pending' && (
        <div className="space-y-3">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => {
              const isDeposit = req.type === 'deposit';

              return (
                <div
                  key={req.id}
                  className="rounded-2xl p-4 bg-[#14213D] border border-[#2A3A5C] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isDeposit
                            ? 'bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {req.type}
                      </span>
                      <span className="font-extrabold text-sm text-white">{req.userName}</span>
                      <span className="text-xs text-[#B0BBD4]">({req.userPhone})</span>
                    </div>

                    <div className="text-xs text-[#B0BBD4] flex items-center gap-3 flex-wrap">
                      <span>Method: <strong className="text-white">{req.method}</strong></span>
                      {req.trxId && (
                        <span>TrxID: <strong className="text-[#FCA311] font-mono">{req.trxId}</strong></span>
                      )}
                      {req.accountNumber && (
                        <span>Wallet: <strong className="text-white font-mono">{req.accountNumber}</strong></span>
                      )}
                      <span>Date: {req.date}</span>
                    </div>

                    {!isDeposit && req.netAmount && (
                      <div className="text-[11px] text-[#B0BBD4]">
                        Net Payout: <strong className="text-white">৳{req.netAmount}</strong> (Fee: ৳{req.fee})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <div className="text-base font-black text-white">৳{req.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-amber-400 font-bold">Pending Review</div>
                    </div>

                    <button
                      onClick={() => approveRequest(req.id)}
                      className="px-4 py-2 rounded-xl bg-[#2ed573] hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => adminDeleteRequest(req.id)}
                      title="Delete Request"
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-300 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-8 text-center text-[#B0BBD4] text-xs">
              🎉 No pending requests in queue!
            </div>
          )}
        </div>
      )}

      {/* Tab: Approved Requests */}
      {activeSubTab === 'approved' && (
        <div className="space-y-2.5">
          {approvedRequests.length === 0 ? (
            <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-8 text-center text-[#B0BBD4] text-xs">
              No approved requests yet.
            </div>
          ) : (
            approvedRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl p-3.5 bg-[#14213D] border border-[#2A3A5C] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{req.userName}</span>
                    <span className="text-[#B0BBD4]">({req.userPhone})</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2ed573]/20 text-[#2ed573] text-[9px] font-extrabold uppercase">
                      {req.type} Approved
                    </span>
                  </div>
                  <div className="text-[11px] text-[#B0BBD4] mt-0.5">
                    Method: {req.method} • {req.trxId ? `TrxID: ${req.trxId}` : `Account: ${req.accountNumber}`} • {req.date}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#2ed573]">৳{req.amount.toLocaleString()}</span>
                  <button
                    onClick={() => adminDeleteRequest(req.id)}
                    title="Delete Request"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Rejected Requests */}
      {activeSubTab === 'rejected' && (
        <div className="space-y-2.5">
          {rejectedRequests.length === 0 ? (
            <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-8 text-center text-[#B0BBD4] text-xs">
              No rejected requests.
            </div>
          ) : (
            rejectedRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl p-3.5 bg-[#14213D] border border-[#2A3A5C] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{req.userName}</span>
                    <span className="text-[#B0BBD4]">({req.userPhone})</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-extrabold uppercase">
                      {req.type} Rejected
                    </span>
                  </div>
                  <div className="text-[11px] text-[#B0BBD4] mt-0.5">
                    Method: {req.method} • {req.date}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-red-400">৳{req.amount.toLocaleString()}</span>
                  <button
                    onClick={() => adminDeleteRequest(req.id)}
                    title="Delete Request"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Users Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by name, phone, account ID, referral code..."
              className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
            />
          </div>

          <div className="space-y-2.5">
            {filteredUsers.length === 0 ? (
              <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-8 text-center text-[#B0BBD4] text-xs">
                No users found.
              </div>
            ) : (
              filteredUsers.map((u, i) => (
                <div
                  key={u.phone}
                  className="rounded-2xl p-4 bg-[#14213D] border border-[#2A3A5C] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#FCA311]">#{i + 1}</span>
                      <span className="font-black text-sm text-white">{u.fullName}</span>
                      <span className="text-xs text-[#B0BBD4] font-mono">({u.phone})</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-extrabold text-amber-300 border border-[#FCA311]/30">
                        VIP {u.activePlanIndex >= 0 ? u.activePlanIndex + 1 : 0}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#B0BBD4] mt-2 bg-black/30 p-2.5 rounded-xl">
                      <div>
                        ID: <span className="font-mono font-bold text-white">{u.id}</span>
                      </div>
                      <div>
                        Balance: <span className="font-bold text-[#2ed573]">৳{u.balance.toLocaleString()}</span>
                      </div>
                      <div>
                        Ref Code: <span className="font-bold text-[#FCA311]">{u.referralCode}</span>
                      </div>
                      <div>
                        Refers: <span className="font-bold text-white">{u.referralCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setAdjustingUser(u);
                        setAdjustAmount('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs active:scale-95 transition-all"
                    >
                      Adjust Balance
                    </button>
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Bond Lottery & Prizes */}
      {activeSubTab === 'bonds' && (
        <div className="space-y-4">
          {/* Bond category switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {RJ_BONDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBondCategory(b.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                  selectedBondCategory === b.id
                    ? 'bg-[#FCA311] text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C]'
                }`}
              >
                {b.name} (৳{b.price})
              </button>
            ))}
          </div>

          {/* Draw & Summary */}
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="font-black text-sm text-white" style={{ color: selectedBondDef.color }}>
                {selectedBondDef.name} — Lottery Center
              </h4>
              <p className="text-xs text-[#B0BBD4] mt-0.5">
                Active tickets in pool: <strong className="text-white">{allBondsList.filter((e) => e.bond.status === 'Active').length}</strong>
              </p>
            </div>

            <button
              onClick={() => executeBondDraw(selectedBondCategory)}
              className="px-5 py-2.5 rounded-xl text-black font-black text-xs shadow-xl active:scale-95 transition-all flex items-center gap-1.5"
              style={{
                background: `linear-gradient(135deg, ${selectedBondDef.color}, #FCA311)`,
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto Execute Random Draw</span>
            </button>
          </div>

          {/* Search single bond number */}
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4">
            <h4 className="text-xs font-extrabold text-[#FCA311] mb-2 uppercase">
              Lookup Specific Bond Number
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bondSearchQuery}
                onChange={(e) => setBondSearchQuery(e.target.value)}
                placeholder="e.g. IT-100-K9X4M2"
                className="flex-1 bg-black/40 border border-[#2A3A5C] rounded-xl px-4 py-2 text-xs font-mono text-white placeholder-gray-500 uppercase focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            {searchedBondResult && (
              <div className="mt-3 p-3 rounded-xl bg-black/50 border border-[#FCA311]/40 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#B0BBD4]">Owner:</span>
                  <span className="font-bold text-white">
                    {searchedBondResult.user.fullName} ({searchedBondResult.user.phone})
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#B0BBD4]">Serial:</span>
                  <span className="font-mono font-black text-[#FCA311]">
                    {searchedBondResult.bond.serialNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#B0BBD4]">Status:</span>
                  <span className="font-bold text-[#2ed573]">{searchedBondResult.bond.status}</span>
                </div>

                {searchedBondResult.bond.status === 'Active' && (
                  <div className="pt-2 flex gap-2 flex-wrap">
                    {selectedBondDef.prizes.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() =>
                          awardBondPrize(
                            searchedBondResult!.bond.serialNumber,
                            p.rank,
                            p.amount
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#2ed573]/20 hover:bg-[#2ed573]/30 border border-[#2ed573]/40 text-[#2ed573] text-[11px] font-black"
                      >
                        Give {p.rank} (৳{p.amount})
                      </button>
                    ))}
                    <button
                      onClick={() => refundBond(searchedBondResult!.bond.serialNumber)}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-[11px] font-bold"
                    >
                      100% Refund Return (৳{searchedBondResult.bond.price})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Bonds Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-[#B0BBD4] px-1">
              Active Purchased Bonds Pool ({allBondsList.length})
            </h4>
            {allBondsList.length > 0 ? (
              allBondsList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#14213D] border border-[#2A3A5C] flex items-center justify-between text-xs gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#FCA311]">
                        {item.bond.serialNumber}
                      </span>
                      <span className="text-[#B0BBD4]">
                        • {item.user.fullName} ({item.user.phone})
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Purchased: {item.bond.purchaseDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                      {item.bond.status}
                    </span>
                    {item.bond.status === 'Active' && (
                      <button
                        onClick={() =>
                          awardBondPrize(
                            item.bond.serialNumber,
                            selectedBondDef.prizes[0].rank,
                            selectedBondDef.prizes[0].amount
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-[10px]"
                      >
                        1st Prize
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-[#14213D] rounded-2xl text-xs text-[#B0BBD4]">
                No bonds purchased in this tier yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-6 shadow-2xl max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Master Admin Security</h3>
              <p className="text-xs text-[#B0BBD4]">Update Admin ID and secure login credentials</p>
            </div>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#B0BBD4]">
                  Admin ID / Username
                </label>
                <span className="text-[10px] text-amber-400 font-mono">Current: {adminId}</span>
              </div>
              <input
                type="text"
                value={newAdminIdState}
                onChange={(e) => setNewAdminIdState(e.target.value)}
                placeholder="e.g. admin or custom ID"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                New Admin Password
              </label>
              <input
                type="password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmAdminPass}
                onChange={(e) => setConfirmAdminPass(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FCA311] to-[#e0900a] text-black font-extrabold text-xs shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
            >
              Save Admin Credentials
            </button>
          </form>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14213D] border border-[#FCA311] rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-black text-white mb-1">
              Adjust Balance for {adjustingUser.fullName}
            </h3>
            <p className="text-xs text-[#B0BBD4] mb-3">
              Current balance: <strong className="text-[#2ed573]">৳{adjustingUser.balance.toLocaleString()}</strong>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Adjustment Amount (+ for credit, - for debit)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 500 or -200"
                  className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Reason / Note
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Deposit correction"
                  className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FCA311] text-black font-black text-xs shadow-lg"
                >
                  Apply Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14213D] border border-red-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-white">Delete User Account?</h3>
              <p className="text-xs text-[#B0BBD4] mt-1.5 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white">{userToDelete.fullName}</strong> ({userToDelete.phone})?
              </p>
              <div className="mt-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 text-left">
                ⚠️ This will delete all investments, bonds, commission records, transaction history, and pending requests for this user.
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adminDeleteUser(userToDelete.phone);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg shadow-red-500/30 active:scale-95 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
