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
    adminFeeWallet,
    adminFeeTransactions,
    adminWithdrawFee,
    approveRequest,
    rejectRequest,
    adminDeleteRequest,
    adminDeleteUser,
    adminToggleUserStatus,
    awardBondPrize,
    refundBond,
    executeBondDraw,
    adminAdjustBalance,
    adminId,
    adminChangeCredentials,
    adminLogout,
    showToast,
    sendGlobalNotification,
    lang,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'pending' | 'approved' | 'rejected' | 'users' | 'bonds' | 'fees' | 'settings'>('analytics');
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
  
  React.useEffect(() => {
    setNewAdminIdState(adminId || 'admin');
  }, [adminId]);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('📢 New Investment Plan Live!');
  const [announceMsg, setAnnounceMsg] = useState('Check out our latest packages for higher returns.');
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
  const pendingFees = pendingRequests
    .filter(r => r.type === 'withdrawal' && r.fee)
    .reduce((sum, r) => sum + (r.fee || 0), 0);
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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
    const res = await adminChangeCredentials(newAdminIdState, newAdminPass);
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
            ৳{totalDeposits === 0 ? "000" : totalDeposits.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold text-[#B0BBD4] uppercase tracking-wider mt-1">
            Total Deposits
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 text-center">
          <div className="text-lg md:text-xl font-black text-red-400">
            ৳{totalWithdrawals === 0 ? "000" : totalWithdrawals.toLocaleString()}
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
          onClick={() => setActiveSubTab('fees')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'fees'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Fees Wallet</span>
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
                      {u.status === 'suspended' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-[10px] font-extrabold text-red-400 border border-red-500/30 uppercase tracking-wider">
                          Suspended
                        </span>
                      )}
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
                      onClick={() => {
                        const res = adminToggleUserStatus(u.phone);
                        if (res.success) showToast(res.message, 'success');
                      }}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1 ${
                        u.status === 'suspended' 
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300' 
                          : 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300'
                      }`}
                    >
                      <span>{u.status === 'suspended' ? 'Unban User' : 'Suspend User'}</span>
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
      {activeSubTab === 'fees' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Available</span>
                </div>
                <h3 className="text-sm font-medium text-indigo-100 mb-1">Fee Balance</h3>
                <div className="text-3xl font-bold">
                  ৳{(!adminFeeWallet?.feeBalance || adminFeeWallet.feeBalance === 0) ? "000" : adminFeeWallet.feeBalance.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">All Time</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Collected</h3>
                <div className="text-2xl font-bold text-gray-900">
                  ৳{(!adminFeeWallet?.totalCollected || adminFeeWallet.totalCollected === 0) ? "000" : adminFeeWallet.totalCollected.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">All Time</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Withdrawn</h3>
                <div className="text-2xl font-bold text-gray-900">
                  ৳{(!adminFeeWallet?.totalWithdrawn || adminFeeWallet.totalWithdrawn === 0) ? "000" : adminFeeWallet.totalWithdrawn.toLocaleString()}
                </div>
              </div>
            
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Uncollected</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Fees</h3>
                <div className="text-2xl font-bold text-gray-900">
                  ৳{pendingFees === 0 ? "000" : pendingFees.toLocaleString()}
                </div>
              </div>
            </div>

            <AdminFeeDashboard 
              wallet={adminFeeWallet} 
              transactions={adminFeeTransactions} 
              onWithdraw={adminWithdrawFee} 
              showToast={showToast}
            />
          </motion.div>
        )}
        {activeSubTab === 'settings' && (
        <>
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

          {/* Global Announcements */}
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-6 shadow-2xl max-w-md mx-auto mt-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Global Announcements</h3>
                <p className="text-xs text-[#B0BBD4]">Send in-app notification to all users</p>
              </div>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#B0BBD4] mb-1">
                  Message
                </label>
                <textarea
                  value={announceMsg}
                  onChange={(e) => setAnnounceMsg(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0A1128] border border-[#2A3A5C] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  if (!announceTitle || !announceMsg) return;
                  const res = sendGlobalNotification(announceTitle, announceMsg);
                  if (res.success) {
                    showToast('Announcement sent to all users!', 'success');
                    setAnnounceTitle('');
                    setAnnounceMsg('');
                  } else {
                    showToast('Failed to send announcement', 'error');
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
              >
                Send Notification Broadcast
              </button>
            </div>
          </div>
        </>
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



const AdminFeeDashboard = ({ wallet, transactions, onWithdraw, showToast }: any) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');
  const [password, setPassword] = useState('');
  
  // Bank specific states
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [branch, setBranch] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    if (!password) {
      if (showToast) showToast('Admin PIN/Password is required', 'error');
      return;
    }
    
    let finalAccountDetails = account;
    if (method === 'Bank') {
      finalAccountDetails = `Bank: ${bankName}, Holder: ${accountHolder}, A/C: ${account}, Branch: ${branch}, Routing: ${routingNumber}`;
    }
    
    const res = onWithdraw(Number(amount), method, finalAccountDetails, note, password);
    if (res && res.success) {
      setAmount('');
      setAccount('');
      setNote('');
      setPassword('');
      setBankName('');
      setAccountHolder('');
      setBranch('');
      setRoutingNumber('');
    } else if (res && showToast) {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <LogOut className="w-5 h-5 mr-2 text-indigo-500" />
            Withdraw Fee Balance
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={wallet?.feeBalance || 0}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select 
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Upay">Upay</option>
                <option value="Bank">Bank Account</option>
              </select>
            </div>
            
            {method !== 'Bank' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input 
                type="text" 
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="e.g. 017XXXXXX"
                required
              />
            </div>
            ) : (
            <div className="space-y-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input type="text" value={account} onChange={(e) => setAccount(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500/50" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500/50" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                  <input type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500/50" required />
                </div>
              </div>
            </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (Optional)</label>
              <input 
                type="text" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Reference or note"
              />
            </div>
            <div className="border-t border-gray-200 pt-4 mt-2">
              <label className="block text-sm font-bold text-gray-900 mb-1 flex items-center">
                <KeyRound className="w-4 h-4 mr-2 text-red-500" />
                Confirm Admin PIN/Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder-red-300"
                placeholder="Enter password to authorize"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!amount || Number(amount) <= 0 || Number(amount) > (wallet?.feeBalance || 0) || !account || !password}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Confirm Withdrawal
            </button>
          </form>
        </div>
      </div>
      
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-indigo-500" />
            Fee Transactions History
          </h3>
          <div className="space-y-4">
            {(!transactions || transactions.length === 0) ? (
              <div className="text-center py-8 text-gray-500">No fee transactions found.</div>
            ) : (
              transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${tx.type === 'collection' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {tx.type === 'collection' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {tx.type === 'collection' ? 'Fee Collected' : 'Admin Withdrawal'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tx.type === 'collection' ? `From user ${tx.userId}` : `Via ${tx.method}`}
                        <span className="mx-2">•</span>
                        {tx.date}
                      </div>
                      {tx.type === 'withdrawal' && tx.note && (
                         <div className="text-xs text-gray-400 mt-1">Note: {tx.note}</div>
                      )}
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'collection' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'collection' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
