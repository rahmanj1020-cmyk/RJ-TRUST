import { useMemo } from 'react';
import { User, Transaction } from '../types';

export interface GenerationStats {
  gen1Users: User[];
  gen2Users: User[];
  gen3Users: User[];
  allTeamUsers: User[];
  totalTeamCount: number;
  
  gen1ActiveCount: number;
  gen2ActiveCount: number;
  gen3ActiveCount: number;
  totalActiveCount: number;

  totalEarnings30Days: number;
  gen1Earnings30Days: number;
  gen2Earnings30Days: number;
  gen3Earnings30Days: number;

  totalEarningsAllTime: number;
  gen1EarningsAllTime: number;
  gen2EarningsAllTime: number;
  gen3EarningsAllTime: number;

  last30DaysReferralTxs: Transaction[];
  allReferralTxs: Transaction[];
  dailyEarnings30Days: { date: string; displayDate: string; amount: number; gen1: number; gen2: number; gen3: number }[];
}

export function parseTxGeneration(tx: Transaction): 1 | 2 | 3 {
  const text = `${tx.title || ''} ${tx.titleBn || ''} ${tx.details || ''}`.toLowerCase();
  if (text.includes('2nd') || text.includes('২য়') || text.includes('gen 2') || text.includes('generation 2') || text.includes('3%')) {
    return 2;
  }
  if (text.includes('3rd') || text.includes('৩য়') || text.includes('gen 3') || text.includes('generation 3') || text.includes('2%')) {
    return 3;
  }
  return 1;
}

export function parseTxTimestamp(tx: Transaction): number {
  if (tx.timestamp && typeof tx.timestamp === 'number' && !isNaN(tx.timestamp)) {
    return tx.timestamp;
  }
  if (tx.date) {
    const parsed = new Date(tx.date).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return Date.now();
}

export function useGenerationStats(
  currentUser: User | null,
  users: Record<string, User>,
  transactions: Transaction[]
): GenerationStats {
  return useMemo(() => {
    if (!currentUser) {
      return {
        gen1Users: [],
        gen2Users: [],
        gen3Users: [],
        allTeamUsers: [],
        totalTeamCount: 0,
        gen1ActiveCount: 0,
        gen2ActiveCount: 0,
        gen3ActiveCount: 0,
        totalActiveCount: 0,
        totalEarnings30Days: 0,
        gen1Earnings30Days: 0,
        gen2Earnings30Days: 0,
        gen3Earnings30Days: 0,
        totalEarningsAllTime: 0,
        gen1EarningsAllTime: 0,
        gen2EarningsAllTime: 0,
        gen3EarningsAllTime: 0,
        last30DaysReferralTxs: [],
        allReferralTxs: [],
        dailyEarnings30Days: [],
      };
    }

    const allUsersList = Object.values(users) as User[];

    // 1st Generation (Direct)
    const gen1Users = allUsersList.filter((u) => u.referredByPhone === currentUser.phone);
    const gen1Phones = new Set(gen1Users.map((u) => u.phone));

    // 2nd Generation (Sub-referrals)
    const gen2Users = allUsersList.filter((u) => u.referredByPhone && gen1Phones.has(u.referredByPhone));
    const gen2Phones = new Set(gen2Users.map((u) => u.phone));

    // 3rd Generation (Team referrals)
    const gen3Users = allUsersList.filter((u) => u.referredByPhone && gen2Phones.has(u.referredByPhone));

    const allTeamUsers = [...gen1Users, ...gen2Users, ...gen3Users];
    const totalTeamCount = allTeamUsers.length;

    const isActive = (u: User) => (u.activePlanIndex !== undefined && u.activePlanIndex >= 0) || (u.investments && u.investments.some(inv => inv.status === 'active'));

    const gen1ActiveCount = gen1Users.filter(isActive).length;
    const gen2ActiveCount = gen2Users.filter(isActive).length;
    const gen3ActiveCount = gen3Users.filter(isActive).length;
    const totalActiveCount = gen1ActiveCount + gen2ActiveCount + gen3ActiveCount;

    // Filter user's referral commission transactions
    const allReferralTxs = transactions.filter(
      (tx) =>
        tx.userId === currentUser.phone &&
        (tx.type === 'referral_commission' || (tx.type === 'bonus' && (tx.title?.includes('Referral') || tx.titleBn?.includes('রেফার'))))
    );

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let totalEarningsAllTime = 0;
    let gen1EarningsAllTime = 0;
    let gen2EarningsAllTime = 0;
    let gen3EarningsAllTime = 0;

    let totalEarnings30Days = 0;
    let gen1Earnings30Days = 0;
    let gen2Earnings30Days = 0;
    let gen3Earnings30Days = 0;

    const last30DaysReferralTxs: Transaction[] = [];

    // Daily mapping for last 30 days
    const dailyMap: Record<string, { amount: number; gen1: number; gen2: number; gen3: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { amount: 0, gen1: 0, gen2: 0, gen3: 0 };
    }

    allReferralTxs.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const gen = parseTxGeneration(tx);
      const ts = parseTxTimestamp(tx);

      // All-time aggregation
      totalEarningsAllTime += amt;
      if (gen === 1) gen1EarningsAllTime += amt;
      else if (gen === 2) gen2EarningsAllTime += amt;
      else if (gen === 3) gen3EarningsAllTime += amt;

      // 30 Days aggregation
      if (ts >= thirtyDaysAgo) {
        last30DaysReferralTxs.push(tx);
        totalEarnings30Days += amt;
        if (gen === 1) gen1Earnings30Days += amt;
        else if (gen === 2) gen2Earnings30Days += amt;
        else if (gen === 3) gen3Earnings30Days += amt;

        const dateKey = new Date(ts).toISOString().slice(0, 10);
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].amount += amt;
          if (gen === 1) dailyMap[dateKey].gen1 += amt;
          else if (gen === 2) dailyMap[dateKey].gen2 += amt;
          else if (gen === 3) dailyMap[dateKey].gen3 += amt;
        }
      }
    });

    const dailyEarnings30Days = Object.entries(dailyMap).map(([date, data]) => {
      const d = new Date(date);
      const displayDate = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      return {
        date,
        displayDate,
        amount: data.amount,
        gen1: data.gen1,
        gen2: data.gen2,
        gen3: data.gen3,
      };
    });

    return {
      gen1Users,
      gen2Users,
      gen3Users,
      allTeamUsers,
      totalTeamCount,
      gen1ActiveCount,
      gen2ActiveCount,
      gen3ActiveCount,
      totalActiveCount,
      totalEarnings30Days,
      gen1Earnings30Days,
      gen2Earnings30Days,
      gen3Earnings30Days,
      totalEarningsAllTime,
      gen1EarningsAllTime,
      gen2EarningsAllTime,
      gen3EarningsAllTime,
      last30DaysReferralTxs,
      allReferralTxs,
      dailyEarnings30Days,
    };
  }, [currentUser, users, transactions]);
}
