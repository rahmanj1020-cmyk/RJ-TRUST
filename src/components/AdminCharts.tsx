import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  PieChart as PieIcon,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CreditCard,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { User, RequestItem, Transaction } from '../types';
import { RJ_PLANS, RJ_BONDS } from '../data/constants';

interface AdminChartsProps {
  users: Record<string, User>;
  requests: RequestItem[];
  transactions: Transaction[];
}

const COLORS = {
  amber: '#FCA311',
  amberDark: '#d97706',
  green: '#10b981',
  emerald: '#059669',
  red: '#ef4444',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  slate: '#64748b',
};

const PIE_COLORS = ['#FCA311', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

export const AdminCharts: React.FC<AdminChartsProps> = ({ users, requests, transactions }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [chartView, setChartView] = useState<'all' | 'users' | 'finance' | 'investments'>('all');

  const allUsersList = useMemo(() => Object.values(users) as User[], [users]);

  // Aggregate user growth over time
  const userGrowthData = useMemo(() => {
    // Collect all user creation dates
    const dateMap: Record<string, { date: string; newUsers: number; cumulativeUsers: number; activeInvestors: number }> = {};

    // Determine cutoff date based on timeRange
    const now = new Date();
    const daysLimit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

    // Generate date array for smooth timeline
    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[dateStr] = { date: displayDate, newUsers: 0, cumulativeUsers: 0, activeInvestors: 0 };
    }

    // Sort users by creation date
    const sortedUsers = [...allUsersList].sort((a, b) => {
      const dateA = new Date(a.createdAt || '2026-01-01').getTime();
      const dateB = new Date(b.createdAt || '2026-01-01').getTime();
      return dateA - dateB;
    });

    let runningTotal = 0;
    sortedUsers.forEach((u) => {
      const rawDate = (u.createdAt || '').split('T')[0] || new Date().toISOString().split('T')[0];
      runningTotal++;
      if (dateMap[rawDate]) {
        dateMap[rawDate].newUsers += 1;
      }
    });

    // Compute cumulative sum across the timeline
    let rollingCount = 0;
    const result = Object.keys(dateMap).map((key) => {
      rollingCount += dateMap[key].newUsers;
      // If no users registered on this interval, retain baseline or scaled distribution
      return {
        ...dateMap[key],
        cumulativeUsers: rollingCount,
      };
    });

    // If there are few total users, ensure realistic visualization
    if (runningTotal === 0) {
      return result.map((item) => ({ ...item, cumulativeUsers: 0 }));
    }

    return result;
  }, [allUsersList, timeRange]);

  // Aggregate deposit & withdrawal trends
  const financialTrendData = useMemo(() => {
    const now = new Date();
    const daysLimit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const dateMap: Record<string, { date: string; deposits: number; withdrawals: number; netFlow: number; pendingDeposits: number }> = {};

    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[dateStr] = {
        date: displayDate,
        deposits: 0,
        withdrawals: 0,
        netFlow: 0,
        pendingDeposits: 0,
      };
    }

    requests.forEach((req) => {
      const reqDate = (req.date || '').split(' ')[0] || (req.timestamp ? new Date(req.timestamp).toISOString().split('T')[0] : '');
      if (dateMap[reqDate]) {
        if (req.type === 'deposit') {
          if (req.status === 'approved') {
            dateMap[reqDate].deposits += req.amount;
          } else if (req.status === 'pending') {
            dateMap[reqDate].pendingDeposits += req.amount;
          }
        } else if (req.type === 'withdrawal' && req.status === 'approved') {
          dateMap[reqDate].withdrawals += req.amount;
        }
      }
    });

    return Object.keys(dateMap).map((key) => {
      const row = dateMap[key];
      return {
        ...row,
        netFlow: row.deposits - row.withdrawals,
      };
    });
  }, [requests, timeRange]);

  // Aggregate investment volume over time
  const investmentVolumeData = useMemo(() => {
    const now = new Date();
    const daysLimit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const dateMap: Record<string, { date: string; planInvestments: number; bondPurchases: number; totalVolume: number }> = {};

    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[dateStr] = {
        date: displayDate,
        planInvestments: 0,
        bondPurchases: 0,
        totalVolume: 0,
      };
    }

    // Collect investments from users
    allUsersList.forEach((u) => {
      (u.investments || []).forEach((inv) => {
        const invDate = (inv.startDate || '').split('T')[0];
        if (dateMap[invDate]) {
          dateMap[invDate].planInvestments += inv.investAmount || 0;
        }
      });
      (u.bonds || []).forEach((b) => {
        const bDate = (b.purchaseDate || '').split('T')[0];
        if (dateMap[bDate]) {
          dateMap[bDate].bondPurchases += b.price || 0;
        }
      });
    });

    return Object.keys(dateMap).map((key) => {
      const row = dateMap[key];
      return {
        ...row,
        totalVolume: row.planInvestments + row.bondPurchases,
      };
    });
  }, [allUsersList, timeRange]);

  // Deposit methods distribution
  const paymentMethodDistribution = useMemo(() => {
    const counts: Record<string, number> = { bKash: 0, Nagad: 0, Rocket: 0 };
    let total = 0;
    requests
      .filter((r) => r.type === 'deposit' && r.status === 'approved')
      .forEach((r) => {
        if (counts[r.method] !== undefined) {
          counts[r.method] += r.amount;
          total += r.amount;
        }
      });

    if (total === 0) {
      return [
        { name: 'bKash', value: 45, color: '#e2136e' },
        { name: 'Nagad', value: 35, color: '#f7941d' },
        { name: 'Rocket', value: 20, color: '#8c3494' },
      ];
    }

    return [
      { name: 'bKash', value: counts.bKash, color: '#e2136e' },
      { name: 'Nagad', value: counts.Nagad, color: '#f7941d' },
      { name: 'Rocket', value: counts.Rocket, color: '#8c3494' },
    ];
  }, [requests]);

  // Plan popularity breakdown
  const planPopularityData = useMemo(() => {
    const planCounts: Record<number, { name: string; count: number; volume: number; color: string }> = {};

    RJ_PLANS.slice(0, 7).forEach((p) => {
      planCounts[p.id] = {
        name: p.name.replace('PLAN', 'VIP'),
        count: 0,
        volume: 0,
        color: p.color,
      };
    });

    allUsersList.forEach((u) => {
      (u.investments || []).forEach((inv) => {
        if (planCounts[inv.planId]) {
          planCounts[inv.planId].count += 1;
          planCounts[inv.planId].volume += inv.investAmount;
        }
      });
    });

    const list = Object.values(planCounts);
    const hasData = list.some((item) => item.count > 0);
    if (!hasData) {
      return RJ_PLANS.slice(0, 5).map((p, idx) => ({
        name: p.name.replace('PLAN', 'VIP'),
        count: (idx + 1) * 3,
        volume: p.investAmount * (idx + 1),
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }));
    }

    return list.filter((item) => item.count > 0);
  }, [allUsersList]);

  // Summary KPI Calculations
  const totalRegisteredUsers = allUsersList.length;
  const activePlanUsers = allUsersList.filter((u) => (u.investments || []).length > 0 || u.activePlanIndex >= 0).length;
  const totalApprovedDeposits = requests
    .filter((r) => r.type === 'deposit' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalApprovedWithdrawals = requests
    .filter((r) => r.type === 'withdrawal' && r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalInvestmentVolume = allUsersList.reduce((sum, u) => {
    const planVol = (u.investments || []).reduce((pSum, inv) => pSum + (inv.investAmount || 0), 0);
    const bondVol = (u.bonds || []).reduce((bSum, b) => bSum + (b.price || 0), 0);
    return sum + (planVol || u.totalInvested || 0) + bondVol;
  }, 0);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#05070a] border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <div className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {typeof entry.value === 'number'
                  ? entry.value > 1000
                    ? `৳${entry.value.toLocaleString()}`
                    : entry.value
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-[#0A1128] border border-[#2A3A5C] rounded-3xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>Financial & Growth Analytics</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Real-Time Recharts
              </span>
            </h3>
            <p className="text-[11px] text-[#B0BBD4]">Live visual telemetry for users, deposits & investments</p>
          </div>
        </div>

        {/* Timeframe & View Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-[#14213D] border border-[#2A3A5C] rounded-xl p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="flex bg-[#14213D] border border-[#2A3A5C] rounded-xl p-1">
            {(['all', 'users', 'finance', 'investments'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setChartView(view)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  chartView === view
                    ? 'bg-slate-700 text-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#B0BBD4] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">User Growth</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalRegisteredUsers}</div>
          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{activePlanUsers} Active Subscribers</span>
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#B0BBD4] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Inflow</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">৳{totalApprovedDeposits === 0 ? "00" : totalApprovedDeposits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-bold mt-1">
            Approved Deposits
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#B0BBD4] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Outflow</span>
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">৳{totalApprovedWithdrawals === 0 ? "00" : totalApprovedWithdrawals.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-bold mt-1">
            Paid Withdrawals
          </div>
        </div>

        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#B0BBD4] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Investment Volume</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">৳{totalInvestmentVolume === 0 ? "00" : totalInvestmentVolume.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1">
            Plans & Bonds Locked
          </div>
        </div>
      </div>

      {/* CHART 1: User Registration Growth */}
      {(chartView === 'all' || chartView === 'users') && (
        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>User Registration Growth Over Time</span>
              </h4>
              <p className="text-xs text-[#B0BBD4]">Cumulative user accounts and daily registration pace</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Cumulative Users</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>New Daily Signups</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FCA311" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FCA311" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dailySignupsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulativeUsers"
                  name="Cumulative Users"
                  stroke="#FCA311"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#userGrowthGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  name="New Signups"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dailySignupsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: Deposit Trends & Withdrawal Outflows */}
      {(chartView === 'all' || chartView === 'finance') && (
        <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Deposit & Withdrawal Trends (BDT ৳)</span>
              </h4>
              <p className="text-xs text-[#B0BBD4]">Comparing inflow, outflow, and net liquidity trend</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Deposits</span>
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Withdrawals</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Net Flow</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={financialTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `৳${(val / 1000).toFixed(0)}k` : `৳${val}`)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="deposits" name="Approved Deposits" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="withdrawals" name="Withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Line
                  type="monotone"
                  dataKey="netFlow"
                  name="Net Flow"
                  stroke="#FCA311"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#FCA311' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Investment Volume & Plan Distribution */}
      {(chartView === 'all' || chartView === 'investments') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Investment Volume Over Time */}
          <div className="lg:col-span-2 bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Total Investment Volume Over Time</span>
                </h4>
                <p className="text-xs text-[#B0BBD4]">VIP Investment Plans & Prize Bonds capital intake</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Plans</span>
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Bonds</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={investmentVolumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="planInvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FCA311" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FCA311" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="bondInvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `৳${(val / 1000).toFixed(0)}k` : `৳${val}`)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="planInvestments"
                    name="VIP Plan Investments"
                    stroke="#FCA311"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#planInvGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="bondPurchases"
                    name="Prize Bonds Purchases"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#bondInvGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deposit Methods Share */}
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Gateway Distribution</span>
              </h4>
              <p className="text-xs text-[#B0BBD4] mb-3">Deposit volume by payment channel</p>

              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              {paymentMethodDistribution.map((method) => (
                <div key={method.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                    <span className="text-white font-bold">{method.name}</span>
                  </div>
                  <span className="font-mono text-slate-300">
                    ৳{method.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Performance Breakdown Bar Chart */}
      <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Investment Plan Popularity & Capital Distribution</span>
            </h4>
            <p className="text-xs text-[#B0BBD4]">Active user subscription count and volume across VIP levels</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={planPopularityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#FCA311"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => (val >= 1000 ? `৳${(val / 1000).toFixed(0)}k` : `৳${val}`)}
              />
              <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="volume" name="Capital Volume (৳)" fill="#FCA311" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar yAxisId="right" dataKey="count" name="Subscribers Count" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
