export interface User {
  id: string; // 9-digit account ID
  phone: string;
  fullName: string;
  password: string;
  balance: number;
  commission: number;
  totalInvested: number;
  totalWithdrawn: number;
  totalDeposited?: number;
  activePlanIndex: number; // -1 if none, 0..14
  planStartDate: string | null;
  referralCode: string;
  referredByPhone: string | null;
  referralCount: number;
  status: 'active' | 'suspended';
  createdAt: string;
  lastClaimDate: Record<number, string>; // planIndex -> YYYY-MM-DD
  lastClaimTimestamp?: Record<number, number>; // planIndex -> timestamp ms
  investments: UserInvestment[];
  bonds: UserBond[];
  lastCheckInDate?: string;
  notifications?: NotificationItem[];
}

export interface InvestmentPlan {
  id: number;
  name: string;
  investAmount: number;
  dailyIncome: number;
  days: number;
  bonusPercent?: number;
  referralPercent: number;
  vipLevel: number;
  category: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM' | 'IRON' | 'BLACK';
  color: string;
  bgColor: string;
  accentColor: string;
}

export interface UserInvestment {
  id: string;
  planId: number;
  planName: string;
  investAmount: number;
  dailyIncome: number;
  days: number;
  bonusPercent?: number;
  startDate: string; // YYYY-MM-DD
  activatedAt?: number; // timestamp in ms
  lastClaimedAt?: number; // timestamp in ms
  nextClaimAt?: number; // timestamp in ms
  claimedDays: number;
  status: 'active' | 'completed' | 'expired';
}

export interface PriceBondDef {
  id: string; // 'b100' | 'b200' | 'b500' | 'b1000'
  name: string;
  price: number;
  icon: string;
  color: string;
  bgColor: string;
  prizes: {
    rank: string;
    amount: number;
    titleBn: string;
  }[];
  moneyBackGuarantee: boolean;
}

export interface UserBond {
  id: string;
  bondDefId: string;
  bondName: string;
  serialNumber: string; // e.g. "IT-100-9X42A"
  price: number;
  purchaseDate: string; // YYYY-MM-DD
  status: 'Active' | '1st Prize' | '2nd Prize' | '3rd Prize' | 'Return';
  prizeAmount?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'daily_income' | 'bonus' | 'referral_commission' | 'bond_purchase' | 'bond_prize' | 'bond_refund' | 'admin_adjustment';
  title: string;
  titleBn: string;
  amount: number; // positive or negative
  status: 'approved' | 'pending' | 'rejected' | 'completed';
  date: string;
  timestamp?: number;
  method?: string;
  trxId?: string;
  details?: string;
}

export interface RequestItem {
  id: string;
  type: 'deposit' | 'withdrawal';
  userPhone: string;
  userName: string;
  userAccountId: string;
  amount: number;
  netAmount?: number;
  fee?: number;
  method: 'bKash' | 'Nagad' | 'Rocket';
  accountNumber?: string;
  trxId?: string;
  date: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support' | 'bot';
  text: string;
  timestamp: string;
  userPhone?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'system' | 'reward' | 'transaction';
}

export interface AdminFeeWallet {
  feeBalance: number;
  totalCollected: number;
  totalWithdrawn: number;
  updatedAt: number;
}

export interface AdminFeeTransaction {
  id: string;
  type: 'collection' | 'withdrawal' | 'refund';
  amount: number;
  method?: string;
  accountDetails?: string;
  withdrawalId?: string; // The user withdrawal that generated this fee
  userId?: string;
  adminId?: string;
  note?: string;
  status: 'completed' | 'pending' | 'rejected';
  date: string;
  timestamp: number;
}

export interface MarketingTeamMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  joinDate: string;
}
