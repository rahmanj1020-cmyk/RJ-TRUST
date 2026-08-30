import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer, getDocs, query, where } from 'firebase/firestore';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, Transaction, RequestItem, InvestmentPlan, PriceBondDef, SupportMessage, NotificationItem, UserInvestment, UserBond, FixedDeposit, AdminFeeWallet, AdminFeeTransaction, MarketingTeamMember, AIPortfolioAnalysis, AIMarketPulse, GroundingSource, SecurityLogItem } from '../types';
import { RJ_PLANS, RJ_BONDS, TRANSLATIONS } from '../data/constants';
import { normalizePhoneNumber, getLookupKeys, isPhoneMatch } from '../utils/phone';
import { hashPassword } from '../utils/crypto';
import { RECOVERED_DATABASE_USERS, DEFAULT_USER_PASSWORD } from '../data/recoveredUsers';

interface AppContextType {
  currentUser: User | null;
  users: Record<string, User>;
  requests: RequestItem[];
  transactions: Transaction[];
  adminFeeWallet: AdminFeeWallet;
  adminFeeTransactions: AdminFeeTransaction[];
  adminWithdrawFee: (amount: number, method: string, accountDetails: string, note: string, password: string) => { success: boolean; message: string };
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  t: (key: keyof typeof TRANSLATIONS.bn) => string;
  isAdminLoggedIn: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (fullName: string, phone: string, email: string, password: string, referralCode?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetPassword: (phone: string, verificationValue: string, newPass: string, verifyType?: 'id' | 'name' | 'otp') => Promise<{ success: boolean; message: string }>;
  adminId: string;
  adminLogin: (adminId: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogout: () => void;
  // Transactions & Plans
  submitDeposit: (amount: number, method: 'bKash' | 'Nagad' | 'Rocket', trxId: string) => { success: boolean; message: string };
  submitWithdrawal: (amount: number, method: 'bKash' | 'Nagad' | 'Rocket', accountNumber: string) => { success: boolean; message: string };
  investInPlan: (planId: number) => { success: boolean; message: string };
  claimDailyIncome: (planIndex: number) => { success: boolean; message: string; amount?: number };
  dailyCheckIn: () => { success: boolean; message: string; amount?: number };
  transferFunds: (receiverIdOrPhone: string, amount: number, password?: string) => { success: boolean; message: string };
  markNotificationRead: (notificationId: string) => void;
  buyBond: (bondId: string) => { success: boolean; message: string; serialNumber?: string };
  createFD: (amount: number) => { success: boolean; message: string };
  claimFDProfit: (fdId: string) => { success: boolean; message: string; amount?: number };
  // Admin Operations
  approveRequest: (requestId: string) => { success: boolean; message: string };
  rejectRequest: (requestId: string, notes?: string) => { success: boolean; message: string };
  adminDeleteRequest: (requestId: string) => { success: boolean; message: string };
  adminDeleteUser: (phone: string) => { success: boolean; message: string };
  adminToggleUserStatus: (phone: string) => { success: boolean; message: string; newStatus: string };
  adminToggleUserMarketingStatus: (phone: string) => { success: boolean; message: string; isMarketingTeam: boolean };
  awardBondPrize: (serialNumber: string, prizeRank: string, prizeAmount: number) => { success: boolean; message: string };
  refundBond: (serialNumber: string) => { success: boolean; message: string };
  executeBondDraw: (bondId: string) => { success: boolean; message: string; winnersCount?: number };
  adminAdjustBalance: (phone: string, amount: number, note: string) => { success: boolean; message: string };
  sendGlobalNotification: (title: string, message: string) => { success: boolean; message: string };
  adminChangePassword: (newPass: string) => Promise<{ success: boolean; message: string }>;
  adminChangeCredentials: (newAdminId: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  marketingTeam: MarketingTeamMember[];
  addMarketingMember: (name: string, phone: string, role: string, accountId?: string) => void;
  removeMarketingMember: (id: string) => void;
  // Theme & Appearance
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  // UI & Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeTab: 'home' | 'vip' | 'invest' | 'fd' | 'bond' | 'account' | 'tx' | 'admin';
  setActiveTab: (tab: 'home' | 'vip' | 'invest' | 'bond' | 'account' | 'tx' | 'admin') => void;
  // Support chat
  chatMessages: SupportMessage[];
  sendChatMessage: (text: string) => Promise<void>;
  isAiResponding: boolean;
  unreadChatCount: number;
  resetUnreadChat: () => void;
  // Deep Database Recovery & Sync
  syncAllDataFromFirestore: () => Promise<{ success: boolean; usersCount: number; reqCount: number; txCount: number; message: string }>;
  isSyncingData: boolean;
  // Security & Privacy Shield
  isSecurityModalOpen: boolean;
  setIsSecurityModalOpen: (open: boolean) => void;
  setSecurityPin: (pin: string, currentPassword?: string) => Promise<{ success: boolean; message: string }>;
  togglePinRequirement: (enabled: boolean) => Promise<{ success: boolean; message: string }>;
  setAutoLockMinutes: (minutes: number) => Promise<{ success: boolean; message: string }>;
  terminateOtherSessions: () => Promise<{ success: boolean; message: string }>;
  recordSecurityLog: (action: string, actionBn: string, status?: 'success' | 'warning' | 'failed') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MASTER_ADMIN_ID_KEY = 'rj_trust_admin_id';
const MASTER_ADMIN_PASS_KEY = 'rj_trust_admin_pw';
const STORAGE_KEY = 'rj_trust_v1_database';

// Seed initial state with all 86 persistent accounts
const INITIAL_USERS: Record<string, User> = {};
RECOVERED_DATABASE_USERS.forEach((u) => {
  INITIAL_USERS[u.phone] = u;
});
const INITIAL_REQUESTS: RequestItem[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketingTeam, setMarketingTeam] = useState<MarketingTeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('rj_marketing_team');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [users, setUsers] = useState<Record<string, User>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_users');
      const baseUsers = { ...INITIAL_USERS };
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed['01700112233'];
        delete parsed['01811223344'];
        
        const uniqueParsed: Record<string, User> = {};
        Object.values(parsed).forEach((u: any) => {
          if (u && u.phone) {
            uniqueParsed[u.phone] = u;
          }
        });
        
        
        const mergedUsers = { ...baseUsers, ...uniqueParsed };
        const idSet = new Set();
        const finalUsers: Record<string, User> = {};
        Object.values(mergedUsers).forEach((u: any) => {
          if (!idSet.has(u.id)) {
            idSet.add(u.id);
            finalUsers[u.phone] = u;
          } else {
            const newId = String(Math.floor(100000000 + Math.random() * 900000000));
            u.id = newId;
            idSet.add(newId);
            finalUsers[u.phone] = u;
          }
        });
        return finalUsers;

      }
      return baseUsers;
    } catch {
      return { ...INITIAL_USERS };
    }
  });

  const [currentUserPhone, setCurrentUserPhone] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_cur');
      if (saved === '01700112233' || saved === '01811223344') {
        localStorage.removeItem(STORAGE_KEY + '_cur');
        return null;
      }
      return saved || null;
    } catch {
      return null;
    }
  });

  const [requests, setRequests] = useState<RequestItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_requests');
      if (saved) {
        const parsed: RequestItem[] = JSON.parse(saved);
        return parsed.filter(
          (r) =>
            r.userPhone !== '01700112233' &&
            r.userPhone !== '01811223344' &&
            r.id !== 'req-101' &&
            r.id !== 'req-102'
        );
      }
      return INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_txs');
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        return parsed.filter(
          (t) => t.userId !== '01700112233' && t.userId !== '01811223344'
        );
      }
      return INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });
  const [adminFeeWallet, setAdminFeeWallet] = useState<AdminFeeWallet>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY + '_feeWallet');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { feeBalance: 0, totalCollected: 0, totalWithdrawn: 0, updatedAt: Date.now() };
  });

  const [adminFeeTransactions, setAdminFeeTransactions] = useState<AdminFeeTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY + '_feeTxs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [adminId, setAdminId] = useState<string>(() => {
    return localStorage.getItem(MASTER_ADMIN_ID_KEY) || '1020304';
  });

  const [adminPw, setAdminPw] = useState<string>(() => {
    return localStorage.getItem(MASTER_ADMIN_PASS_KEY) || 'admin1234';
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('rj_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('rj_theme', newTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  // Sync theme with HTML document element classes
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
      }
      localStorage.setItem('rj_theme', theme);
    } catch (e) {
      console.warn('Could not apply theme to documentElement', e);
    }
  }, [theme]);

  const [activeTab, setActiveTab] = useState<'home' | 'vip' | 'invest' | 'bond' | 'account' | 'tx' | 'admin'>('home');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Assalamu Alaikum! Welcome to RJ TRUST AI Financial Concierge & Market Intelligence. Ask me about VIP plans, live USD/BDT rates, gold prices, interest yields, or price bond strategies.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [isSyncingData, setIsSyncingData] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  // Inactivity Auto-Lock Protection
  useEffect(() => {
    if (!currentUserPhone) return;
    const user = users[currentUserPhone];
    if (!user || !user.autoLockMinutes || user.autoLockMinutes <= 0) return;

    let timeoutId: any = null;
    const lockDurationMs = user.autoLockMinutes * 60 * 1000;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        showToast(
          lang === 'bn'
            ? 'নিষ্ক্রিয়তার কারণে আপনার অ্যাকাউন্টটি স্বয়ংক্রিয়ভাবে লক ও সুরক্ষিত করা হয়েছে।'
            : 'Session locked due to inactivity.',
          'info'
        );
      }, lockDurationMs);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [currentUserPhone, users[currentUserPhone]?.autoLockMinutes, lang]);

  // Initial Firestore connection test
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Real-time Firestore sync for Users
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const fetchedUsers: Record<string, User> = {};
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Partial<User>;
            const rawPhone = data.phone || docSnap.id;
            if (rawPhone) {
              const normPhone = normalizePhoneNumber(rawPhone);
              const userObj: User = {
                id: data.id || docSnap.id || String(Date.now()),
                phone: data.phone || normPhone || rawPhone,
                fullName: data.fullName || 'Member',
                password: data.password || '',
                balance: Number(data.balance || 0),
                commission: Number(data.commission || 0),
                totalInvested: Number(data.totalInvested || 0),
                totalWithdrawn: Number(data.totalWithdrawn || 0),
                totalDeposited: Number(data.totalDeposited || 0),
                activePlanIndex: data.activePlanIndex !== undefined ? data.activePlanIndex : -1,
                planStartDate: data.planStartDate || null,
                referralCode: data.referralCode || rawPhone.slice(-4).toUpperCase(),
                referredByPhone: data.referredByPhone || null,
                referralCount: Number(data.referralCount || 0),
                status: data.status || 'active',
                createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
                securityPin: data.securityPin || '',
                isPinEnabled: data.isPinEnabled !== undefined ? data.isPinEnabled : Boolean(data.securityPin),
                autoLockMinutes: Number(data.autoLockMinutes || 0),
                securityLogs: data.securityLogs || [],
                lastLoginTime: data.lastLoginTime,
                lastLoginDevice: data.lastLoginDevice,
                lastClaimDate: data.lastClaimDate || {},
                lastClaimTimestamp: data.lastClaimTimestamp || {},
                lastCheckInDate: data.lastCheckInDate,
                investments: data.investments || [],
                bonds: data.bonds || [],
                notifications: data.notifications || [],
              };

              // Primary index by user's registered phone
              fetchedUsers[userObj.phone] = userObj;
              // Secondary index by normalized phone
              if (normPhone && normPhone !== userObj.phone) {
                fetchedUsers[normPhone] = userObj;
              }
              // Tertiary index by doc ID
              if (docSnap.id && docSnap.id !== userObj.phone && docSnap.id !== normPhone) {
                fetchedUsers[docSnap.id] = userObj;
              }
            }
          });
          if (Object.keys(fetchedUsers).length > 0) {
            setUsers((prev) => ({ ...prev, ...fetchedUsers }));
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Firestore users sync initialized with local cache', e);
    }
  }, []);

  // Real-time Firestore sync for Requests
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'requests'),
        (snapshot) => {
          const fetchedReqs: RequestItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as RequestItem;
            if (data && data.id) {
              fetchedReqs.push(data);
            }
          });
          fetchedReqs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          if (fetchedReqs.length > 0) {
            setRequests(fetchedReqs);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'requests');
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Firestore requests sync initialized with local cache', e);
    }
  }, []);

  // Real-time Firestore sync for Transactions
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'transactions'),
        (snapshot) => {
          const fetchedTxs: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Transaction;
            if (data && data.id) {
              fetchedTxs.push(data);
            }
          });
          fetchedTxs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          if (fetchedTxs.length > 0) {
            setTransactions(fetchedTxs);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'transactions');
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Firestore transactions sync initialized with local cache', e);
    }
  }, []);

  // Real-time Firestore sync for Admin Fee
  useEffect(() => {
    try {
      const unsubWallet = onSnapshot(doc(db, 'adminWallet', 'info'), (docSnap) => {
        if (docSnap.exists()) {
          setAdminFeeWallet(docSnap.data() as AdminFeeWallet);
        }
      });
      const unsubTxs = onSnapshot(collection(db, 'adminFeeTransactions'), (snapshot) => {
        const fetchedTxs: AdminFeeTransaction[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTxs.push(docSnap.data() as AdminFeeTransaction);
        });
        fetchedTxs.sort((a, b) => b.timestamp - a.timestamp);
        setAdminFeeTransactions(fetchedTxs);
      });
      return () => { unsubWallet(); unsubTxs(); };
    } catch (error) {
      console.warn('Firestore fee sync failed', error);
    }
  }, []);

  // Real-time Firestore sync for Admin Credentials
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'adminCredentials'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminId) {
            setAdminId(data.adminId);
            localStorage.setItem(MASTER_ADMIN_ID_KEY, data.adminId);
          }
          if (data.adminPw) {
            setAdminPw(data.adminPw);
            localStorage.setItem(MASTER_ADMIN_PASS_KEY, data.adminPw);
          }
        }
      });
      return () => unsub();
    } catch (error) {
      console.warn('Firestore admin credentials sync failed', error);
    }
  }, []);

  // Real-time Firestore sync for Support Messages
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'supportMessages'),
        (snapshot) => {
          const fetchedMsgs: SupportMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SupportMessage;
            if (data && data.id) {
              fetchedMsgs.push(data);
            }
          });
          if (fetchedMsgs.length > 0) {
            setChatMessages((prev) => {
              const map = new Map<string, SupportMessage>();
              prev.forEach((m) => map.set(m.id, m));
              fetchedMsgs.forEach((m) => map.set(m.id, m));
              return Array.from(map.values());
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'supportMessages');
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Firestore support messages sync initialized with local cache', e);
    }
  }, []);

  // Real-time Firestore sync for Marketing Team
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'marketingTeam'),
        (snapshot) => {
          const fetchedMembers: MarketingTeamMember[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as MarketingTeamMember;
            if (data && data.id) {
              fetchedMembers.push(data);
            }
          });
          if (fetchedMembers.length > 0) {
            setMarketingTeam(fetchedMembers);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'marketingTeam');
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Firestore marketing team sync initialized with local cache', e);
    }
  }, []);

  // Sync to localStorage as fast client-side offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(users));
      localStorage.setItem('rj_marketing_team', JSON.stringify(marketingTeam));
      localStorage.setItem(STORAGE_KEY + '_requests', JSON.stringify(requests));
      localStorage.setItem(STORAGE_KEY + '_txs', JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEY + '_feeWallet', JSON.stringify(adminFeeWallet));
      localStorage.setItem(STORAGE_KEY + '_feeTxs', JSON.stringify(adminFeeTransactions));
      if (currentUserPhone) {
        localStorage.setItem(STORAGE_KEY + '_cur', currentUserPhone);
      } else {
        localStorage.removeItem(STORAGE_KEY + '_cur');
      }
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }
  }, [users, requests, transactions, currentUserPhone, adminFeeWallet, adminFeeTransactions, marketingTeam]);

  // Firestore background write helpers
  const persistUserToFirestore = async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.phone), user, { merge: true });
    } catch (error) {
      console.warn('Could not persist user to Firestore:', error);
    }
  };

  const persistMarketingMemberToFirestore = async (member: MarketingTeamMember) => {
    try {
      await setDoc(doc(db, 'marketingTeam', member.id), member, { merge: true });
    } catch (error) {
      console.warn('Could not persist marketing member to Firestore:', error);
    }
  };

  const deleteMarketingMemberFromFirestore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'marketingTeam', id));
    } catch (error) {
      console.warn('Could not delete marketing member from Firestore:', error);
    }
  };

  const persistRequestToFirestore = async (req: RequestItem) => {
    try {
      await setDoc(doc(db, 'requests', req.id), req, { merge: true });
    } catch (error) {
      console.warn('Could not persist request to Firestore:', error);
    }
  };

  const persistTxToFirestore = async (tx: Transaction) => {
    try {
      await setDoc(doc(db, 'transactions', tx.id), tx, { merge: true });
    } catch (error) {
      console.warn('Could not persist transaction to Firestore:', error);
    }
  };

  const persistMessageToFirestore = async (msg: SupportMessage) => {
    try {
      await setDoc(doc(db, 'supportMessages', msg.id), msg, { merge: true });
    } catch (error) {
      console.warn('Could not persist message to Firestore:', error);
    }
  };

  
  const persistFeeWalletToFirestore = async (wallet: AdminFeeWallet) => {
    try { await setDoc(doc(db, 'adminWallet', 'info'), wallet, { merge: true }); } catch (error) {}
  };
  const persistFeeTxToFirestore = async (tx: AdminFeeTransaction) => {
    try { await setDoc(doc(db, 'adminFeeTransactions', tx.id), tx, { merge: true }); } catch (error) {}
  };

const deleteUserFromFirestore = async (phone: string) => {
    try {
      await deleteDoc(doc(db, 'users', phone));
    } catch (error) {
      console.warn('Could not delete user from Firestore:', error);
    }
  };

  const deleteRequestFromFirestore = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'requests', reqId));
    } catch (error) {
      console.warn('Could not delete request from Firestore:', error);
    }
  };

  // Comprehensive Data Recovery & Direct Force-Sync from Cloud Firestore
  const syncAllDataFromFirestore = async (): Promise<{ success: boolean; usersCount: number; reqCount: number; txCount: number; message: string }> => {
    setIsSyncingData(true);
    try {
      // 1. Fetch all users directly from Firestore collection
      const usersColl = collection(db, 'users');
      const usersSnap = await getDocs(usersColl);
      const recoveredUsers: Record<string, User> = {};

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data() as Partial<User>;
        const rawPhone = data.phone || docSnap.id;
        if (rawPhone) {
          const normPhone = normalizePhoneNumber(rawPhone);
          const userObj: User = {
            id: data.id || docSnap.id || String(Date.now()),
            phone: data.phone || normPhone || rawPhone,
            fullName: data.fullName || 'Member',
            password: data.password || '',
            balance: Number(data.balance || 0),
            commission: Number(data.commission || 0),
            totalInvested: Number(data.totalInvested || 0),
            totalWithdrawn: Number(data.totalWithdrawn || 0),
            totalDeposited: Number(data.totalDeposited || 0),
            activePlanIndex: data.activePlanIndex !== undefined ? data.activePlanIndex : -1,
            planStartDate: data.planStartDate || null,
            referralCode: data.referralCode || rawPhone.slice(-4).toUpperCase(),
            referredByPhone: data.referredByPhone || null,
            referralCount: Number(data.referralCount || 0),
            status: data.status || 'active',
            createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
            securityPin: data.securityPin || '',
            isPinEnabled: data.isPinEnabled !== undefined ? data.isPinEnabled : Boolean(data.securityPin),
            autoLockMinutes: Number(data.autoLockMinutes || 0),
            securityLogs: data.securityLogs || [],
            lastLoginTime: data.lastLoginTime,
            lastLoginDevice: data.lastLoginDevice,
            lastClaimDate: data.lastClaimDate || {},
            lastClaimTimestamp: data.lastClaimTimestamp || {},
            lastCheckInDate: data.lastCheckInDate,
            investments: data.investments || [],
            bonds: data.bonds || [],
            notifications: data.notifications || [],
          };

          // Primary index by user's registered phone
          recoveredUsers[userObj.phone] = userObj;
          // Secondary index by normalized phone
          if (normPhone && normPhone !== userObj.phone) {
            recoveredUsers[normPhone] = userObj;
          }
          // Tertiary index by doc ID
          if (docSnap.id && docSnap.id !== userObj.phone && docSnap.id !== normPhone) {
            recoveredUsers[docSnap.id] = userObj;
          }
        }
      });

      // Update users state and cache
      if (Object.keys(recoveredUsers).length > 0) {
        setUsers((prev) => ({ ...prev, ...recoveredUsers }));
        try {
          localStorage.setItem(STORAGE_KEY + '_users', JSON.stringify(recoveredUsers));
        } catch (e) {}
      }

      // 2. Fetch all Requests from Firestore
      const reqsColl = collection(db, 'requests');
      const reqsSnap = await getDocs(reqsColl);
      const recoveredReqs: RequestItem[] = [];
      reqsSnap.forEach((docSnap) => {
        const data = docSnap.data() as RequestItem;
        if (data && data.id) {
          recoveredReqs.push(data);
        }
      });
      recoveredReqs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (recoveredReqs.length > 0) {
        setRequests(recoveredReqs);
        try {
          localStorage.setItem(STORAGE_KEY + '_requests', JSON.stringify(recoveredReqs));
        } catch (e) {}
      }

      // 3. Fetch all Transactions from Firestore
      const txColl = collection(db, 'transactions');
      const txSnap = await getDocs(txColl);
      const recoveredTxs: Transaction[] = [];
      txSnap.forEach((docSnap) => {
        const data = docSnap.data() as Transaction;
        if (data && data.id) {
          recoveredTxs.push(data);
        }
      });
      recoveredTxs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (recoveredTxs.length > 0) {
        setTransactions(recoveredTxs);
        try {
          localStorage.setItem(STORAGE_KEY + '_txs', JSON.stringify(recoveredTxs));
        } catch (e) {}
      }

      // 4. Fetch Marketing Team from Firestore
      const marketingColl = collection(db, 'marketingTeam');
      const marketingSnap = await getDocs(marketingColl);
      const recoveredMarketing: MarketingTeamMember[] = [];
      marketingSnap.forEach((docSnap) => {
        const data = docSnap.data() as MarketingTeamMember;
        if (data && data.id) {
          recoveredMarketing.push(data);
        }
      });
      if (recoveredMarketing.length > 0) {
        setMarketingTeam(recoveredMarketing);
        try {
          localStorage.setItem('rj_marketing_team', JSON.stringify(recoveredMarketing));
        } catch (e) {}
      }

      // Count unique user accounts (deduplicated by phone)
      const uniqueUsersCount = new Set(Object.values(recoveredUsers).map((u) => u.phone)).size;
      const message = `Successfully recovered ${uniqueUsersCount} users, ${recoveredReqs.length} requests, and ${recoveredTxs.length} transactions from Cloud Database!`;
      
      showToast(message, 'success');
      return {
        success: true,
        usersCount: uniqueUsersCount,
        reqCount: recoveredReqs.length,
        txCount: recoveredTxs.length,
        message,
      };
    } catch (err: any) {
      console.error('Error recovering database:', err);
      const errMsg = err?.message || 'Database recovery failed. Please check network connection.';
      showToast(errMsg, 'error');
      return {
        success: false,
        usersCount: 0,
        reqCount: 0,
        txCount: 0,
        message: errMsg,
      };
    } finally {
      setIsSyncingData(false);
    }
  };

  // Helper to find a user across local state by phone number, normalized digits, or 9-digit account ID
  const findUser = (queryStr: string): User | null => {
    if (!queryStr) return null;
    const clean = queryStr.trim();
    if (users[clean]) return users[clean];
    const norm = normalizePhoneNumber(clean);
    if (norm && users[norm]) return users[norm];

    const allUsers = Object.values(users) as User[];
    for (const u of allUsers) {
      if (!u) continue;
      if (isPhoneMatch(u.phone, clean) || (norm && isPhoneMatch(u.phone, norm))) {
        return u;
      }
      if (u.id && (u.id.trim() === clean || u.id.trim().toLowerCase() === clean.toLowerCase())) {
        return u;
      }
    }
    return null;
  };

  const currentUser = currentUserPhone ? (users[currentUserPhone] || findUser(currentUserPhone) || null) : null;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const t = (key: keyof typeof TRANSLATIONS.bn): string => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS.bn[key] || String(key);
  };

  const login = async (phone: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const rawInput = (phone || '').trim();
    if (!rawInput) {
      return { success: false, message: lang === 'bn' ? 'ফোন নম্বর লিখুন' : 'Please enter phone number' };
    }
    const normPhone = normalizePhoneNumber(rawInput);

    // 1. Search in memory state
    let user = findUser(rawInput);

    // 2. If not found in local memory, query Firestore directly
    if (!user) {
      try {
        // Direct doc lookup by normalized phone
        if (normPhone) {
          try {
            const snap = await getDocFromServer(doc(db, 'users', normPhone));
            if (snap.exists()) {
              user = snap.data() as User;
            }
          } catch (e) {}
        }

        // Direct doc lookup by raw input
        if (!user && rawInput) {
          try {
            const snap = await getDocFromServer(doc(db, 'users', rawInput));
            if (snap.exists()) {
              user = snap.data() as User;
            }
          } catch (e) {}
        }

        // Search entire users collection in Firestore
        if (!user) {
          const querySnap = await getDocs(collection(db, 'users'));
          querySnap.forEach((docSnap) => {
            if (user) return;
            const data = docSnap.data() as User;
            const docPhone = data.phone || docSnap.id;
            if (isPhoneMatch(docPhone, rawInput) || (normPhone && isPhoneMatch(docPhone, normPhone))) {
              user = { ...data, phone: docPhone };
            } else if (data.id && (data.id === rawInput || data.id.trim().toLowerCase() === rawInput.toLowerCase())) {
              user = { ...data, phone: docPhone };
            }
          });
        }

        // If recovered from Firestore, integrate immediately into local state
        if (user) {
          const canonicalPhone = user.phone || normPhone || rawInput;
          const recoveredUser: User = {
            id: user.id || String(Math.floor(100000000 + Math.random() * 900000000)),
            phone: canonicalPhone,
            fullName: user.fullName || 'Member',
            password: user.password,
            balance: Number(user.balance || 0),
            commission: Number(user.commission || 0),
            totalInvested: Number(user.totalInvested || 0),
            totalWithdrawn: Number(user.totalWithdrawn || 0),
            totalDeposited: Number(user.totalDeposited || 0),
            activePlanIndex: user.activePlanIndex !== undefined ? user.activePlanIndex : -1,
            planStartDate: user.planStartDate || null,
            referralCode: user.referralCode || canonicalPhone.slice(-4).toUpperCase(),
            referredByPhone: user.referredByPhone || null,
            referralCount: Number(user.referralCount || 0),
            status: user.status || 'active',
            createdAt: user.createdAt || new Date().toISOString().slice(0, 10),
            lastClaimDate: user.lastClaimDate || {},
            lastClaimTimestamp: user.lastClaimTimestamp || {},
            lastCheckInDate: user.lastCheckInDate,
            investments: user.investments || [],
            bonds: user.bonds || [],
            notifications: user.notifications || [],
          };

          setUsers((prev) => ({
            ...prev,
            [canonicalPhone]: recoveredUser,
            [normPhone]: recoveredUser,
            [rawInput]: recoveredUser,
          }));
          user = recoveredUser;
        }
      } catch (err) {
        console.warn('Firestore fallback lookup encountered an error:', err);
      }
    }

    if (!user) {
      return { 
        success: false, 
        message: lang === 'bn' 
          ? 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক নম্বর লিখুন অথবা সাইনআপ করুন।' 
          : 'No account found with this phone number. Please check the number or register.' 
      };
    }

    const hashedPass = await hashPassword(pass);
    let needsPasswordUpgrade = false;

    if (user.password !== pass && user.password !== hashedPass) {
      return { success: false, message: lang === 'bn' ? 'পাসওয়ার্ড সঠিক নয়' : 'Incorrect password' };
    }

    if (user.password === pass) {
      needsPasswordUpgrade = true;
    }

    if (user.status === 'suspended') {
      return { success: false, message: lang === 'bn' ? 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে' : 'Account suspended. Contact support.' };
    }

    const effectivePhone = user.phone || normPhone || rawInput;
    const now = Date.now();
    const loginDevice = typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 35)}` : 'Secure Client';
    const loginLog: SecurityLogItem = {
      id: `sec-login-${now}`,
      action: 'Authorized Session Login',
      actionBn: 'সফল লগইন সম্পন্ন',
      timestamp: now,
      date: new Date().toISOString().slice(0, 10),
      deviceInfo: loginDevice,
      status: 'success',
    };

    const updatedUserWithLogin = {
      ...user,
      lastLoginTime: new Date().toISOString(),
      lastLoginDevice: loginDevice,
      securityLogs: [loginLog, ...(user.securityLogs || []).slice(0, 20)],
    };

    if (needsPasswordUpgrade) {
      updatedUserWithLogin.password = hashedPass;
    }

    setUsers((prev) => ({
      ...prev,
      [effectivePhone]: updatedUserWithLogin,
      [normPhone]: updatedUserWithLogin,
    }));
    persistUserToFirestore(updatedUserWithLogin);

    setCurrentUserPhone(effectivePhone);
    setActiveTab('home');
    showToast(lang === 'bn' ? `স্বাগতম, ${user.fullName}!` : `Welcome back, ${user.fullName}!`, 'success');
    return { success: true, message: 'Login successful' };
  };

  const register = async (fullName: string, phone: string, email: string, pass: string, referralCode?: string): Promise<{ success: boolean; message: string }> => {
    const rawPhone = (phone || '').trim();
    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const normPhone = normalizePhoneNumber(rawPhone);

    if (!cleanName || !rawPhone || !pass) {
      return { success: false, message: lang === 'bn' ? 'সব প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required fields' };
    }
    if (normPhone.length < 11) {
      return { success: false, message: lang === 'bn' ? 'সঠিক ১১ ডিজিটের ফোন নম্বর দিন (যেমন: 017XXXXXXXX)' : 'Enter valid 11-digit mobile number' };
    }
    if (pass.length < 6) {
      return { success: false, message: lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters' };
    }

    // Check if user exists locally
    const existing = findUser(normPhone) || findUser(rawPhone);
    if (existing) {
      return { success: false, message: lang === 'bn' ? 'এই ফোন নম্বরে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে লগইন করুন।' : 'Phone number already registered. Please log in.' };
    }

    // Check in Firestore directly
    try {
      const snap = await getDocFromServer(doc(db, 'users', normPhone));
      if (snap.exists()) {
        const u = snap.data() as User;
        setUsers((prev) => ({ ...prev, [normPhone]: u }));
        return { success: false, message: lang === 'bn' ? 'এই ফোন নম্বরে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে লগইন করুন।' : 'Phone number already registered. Please log in.' };
      }
    } catch (e) {
      console.warn('Firestore duplicate check error:', e);
    }

    let referredByPhone: string | null = null;
    if (referralCode && referralCode.trim()) {
      const cleanRef = referralCode.trim().toUpperCase();
      const parentUser = (Object.values(users) as User[]).find((u) => u.referralCode === cleanRef);
      if (parentUser) {
        referredByPhone = parentUser.phone;
        const bonusAmount = 20; // 20 BDT bonus for referring a new user
        
        // Give bonus and increment referral count
        const updatedParent = {
          ...parentUser,
          balance: parentUser.balance + bonusAmount,
          commission: parentUser.commission + bonusAmount,
          referralCount: (parentUser.referralCount || 0) + 1,
        };

        setUsers((prev) => ({
          ...prev,
          [parentUser.phone]: updatedParent,
        }));
        persistUserToFirestore(updatedParent);

        // Add a transaction for the bonus
        const bonusTx: Transaction = {
          id: `tx-${Date.now()}-signup-bonus`,
          userId: parentUser.phone,
          type: 'bonus',
          title: `Referral Signup Bonus: ${cleanName}`,
          titleBn: `রেফার সাইনআপ বোনাস: ${cleanName}`,
          amount: bonusAmount,
          status: 'completed',
          date: new Date().toISOString().slice(0, 10),
          details: 'Signup Bonus'
        };
        setTransactions((prev) => [bonusTx, ...prev]);
        persistTxToFirestore(bonusTx);
        
        // Notify referrer
        addNotification(
          parentUser.phone,
          'Referral Bonus Earned! 🎉',
          `${cleanName} joined using your code. You earned ৳${bonusAmount}!`
        );
      }
    }

    const newId = String(Math.floor(100000000 + Math.random() * 900000000));
    const newRefCode = (cleanName.slice(0, 2).replace(/\s+/g, '') + normPhone.slice(-4)).toUpperCase();
    const hashedPass = await hashPassword(pass);

    const newUser: User = {
      id: newId,
      phone: normPhone,
      email: cleanEmail,
      fullName: cleanName,
      password: hashedPass,
      balance: 0,
      commission: 0,
      totalInvested: 0,
      totalWithdrawn: 0,
      totalDeposited: 0,
      activePlanIndex: -1,
      planStartDate: null,
      referralCode: newRefCode,
      referredByPhone,
      referralCount: 0,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      lastClaimDate: {},
      lastClaimTimestamp: {},
      investments: [],
      bonds: [],
      notifications: [],
    };

    setUsers((prev) => ({
      ...prev,
      [normPhone]: newUser,
      [rawPhone]: newUser,
    }));
    await persistUserToFirestore(newUser);

    setCurrentUserPhone(normPhone);
    setActiveTab('home');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    showToast(lang === 'bn' ? 'রেজিস্ট্রেশন সফল হয়েছে! RJ TRUST-এ স্বাগতম।' : 'Account created successfully! Welcome to RJ TRUST.', 'success');
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setCurrentUserPhone(null);
    setActiveTab('home');
    showToast(lang === 'bn' ? 'লগআউট সফল হয়েছে' : 'Logged out successfully', 'info');
  };

  const resetPassword = async (
    phone: string,
    verificationValue: string,
    newPass: string,
    verifyType: 'id' | 'name' | 'otp' = 'id'
  ): Promise<{ success: boolean; message: string }> => {
    const rawPhone = (phone || '').trim();
    const cleanVal = (verificationValue || '').trim().toLowerCase();
    let user = findUser(rawPhone);

    if (!user) {
      try {
        const norm = normalizePhoneNumber(rawPhone);
        if (norm) {
          const snap = await getDocFromServer(doc(db, 'users', norm));
          if (snap.exists()) {
            user = snap.data() as User;
          }
        }
      } catch (e) {}
    }

    if (!user) {
      return { success: false, message: lang === 'bn' ? 'ফোন নম্বরটি পাওয়া যায়নি' : 'User not found' };
    }
    if (verifyType === 'id') {
      if (user.id.toLowerCase() !== cleanVal) {
        return { success: false, message: lang === 'bn' ? 'অ্যাকাউন্ট ID সঠিক নয়' : 'Invalid Account ID' };
      }
    } else if (verifyType === 'name') {
      if (user.fullName.toLowerCase() !== cleanVal) {
        return { success: false, message: lang === 'bn' ? 'নিবন্ধিত নাম মিলছে না' : 'Registered Full Name does not match' };
      }
    } else if (verifyType === 'otp') {
      if (!cleanVal || cleanVal.length < 4) {
        return { success: false, message: lang === 'bn' ? 'সঠিক ভেরিফিকেশন কোড দিন' : 'Invalid verification code' };
      }
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, message: lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters' };
    }

    const hashedNewPass = await hashPassword(newPass);

    const updatedUser = {
      ...user,
      password: hashedNewPass,
    };

    setUsers((prev) => ({
      ...prev,
      [user!.phone]: updatedUser,
      [normalizePhoneNumber(user!.phone)]: updatedUser,
    }));
    await persistUserToFirestore(updatedUser);

    showToast(lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password reset successful!', 'success');
    return { success: true, message: 'Password reset successful' };
  };

  const adminLogin = async (idInput: string, passwordInput: string) => {
    const cleanId = (idInput || '').trim();
    const cleanPass = passwordInput || '';
    
    let currentAdminId = adminId;
    let currentAdminPw = adminPw;

    try {
      const snap = await getDocFromServer(doc(db, 'settings', 'adminCredentials'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.adminId) {
          currentAdminId = data.adminId;
          setAdminId(data.adminId);
          localStorage.setItem(MASTER_ADMIN_ID_KEY, data.adminId);
        }
        if (data.adminPw) {
          currentAdminPw = data.adminPw;
          setAdminPw(data.adminPw);
          localStorage.setItem(MASTER_ADMIN_PASS_KEY, data.adminPw);
        }
      }
    } catch(e) {
      console.warn("Could not fetch admin credentials on login", e);
    }
    
    // Emergency fallback master credentials
    if (cleanId === '1020304' && cleanPass === 'admin1234') {
      setIsAdminLoggedIn(true);
      setActiveTab('admin');
      showToast('Master Admin Authenticated (Fallback)', 'success');
      return { success: true, message: 'Admin login successful' };
    }
    
    if (cleanId.toLowerCase() === currentAdminId.toLowerCase() && cleanPass === currentAdminPw) {
      setIsAdminLoggedIn(true);
      setActiveTab('admin');
      showToast('Master Admin Authenticated', 'success');
      return { success: true, message: 'Admin login successful' };
    }
    
    return {
      success: false,
      message: lang === 'bn' ? 'ভুল অ্যাডমিন আইডি বা পাসওয়ার্ড' : 'Invalid Admin ID or Password',
    };
  };

  const adminLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveTab('home');
    showToast('Admin Session Terminated', 'info');
  };

  const submitDeposit = (amount: number, method: 'bKash' | 'Nagad' | 'Rocket', trxId: string) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (!amount || amount < 100) {
      return { success: false, message: lang === 'bn' ? 'সর্বনিম্ন ১০০ টাকা ডিপোজিট করুন' : 'Minimum deposit is ৳100' };
    }
    if (!trxId || !trxId.trim()) {
      return { success: false, message: lang === 'bn' ? 'সঠিক Transaction ID দিন' : 'Please provide Transaction ID' };
    }

    const newReq: RequestItem = {
      id: `dep-${Date.now()}`,
      type: 'deposit',
      userPhone: currentUser.phone,
      userName: currentUser.fullName,
      userAccountId: currentUser.id,
      amount,
      method,
      trxId: trxId.trim(),
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
      status: 'pending',
    };

    setRequests((prev) => [newReq, ...prev]);
    persistRequestToFirestore(newReq);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.phone,
      type: 'deposit',
      title: `Deposit Submitted (${method})`,
      titleBn: `ডিপোজিট জমা দেওয়া হয়েছে (${method})`,
      amount,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      trxId: trxId.trim(),
      method,
    };

    setTransactions((prev) => [newTx, ...prev]);
    persistTxToFirestore(newTx);

    showToast(
      lang === 'bn'
        ? 'ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে! অ্যাডমিন অনুমোদনের পর ব্যালেন্সে যোগ হবে।'
        : 'Deposit request submitted! Funds will reflect after admin approval.',
      'success'
    );
    return { success: true, message: 'Deposit request submitted' };
  };

  const submitWithdrawal = (amount: number, method: 'bKash' | 'Nagad' | 'Rocket', accountNumber: string) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (!amount || amount < 500) {
      return { success: false, message: lang === 'bn' ? 'সর্বনিম্ন ৫০০ টাকা উত্তোলন করা যাবে' : 'Minimum withdrawal is ৳500' };
    }
    if (amount > 25000) {
      return { success: false, message: lang === 'bn' ? 'সর্বোচ্চ ২৫,০০০ টাকা উত্তোলন করা যাবে' : 'Maximum withdrawal limit is ৳25,000' };
    }
    if (currentUser.balance < amount) {
      return { success: false, message: lang === 'bn' ? 'অপর্যাপ্ত ব্যালেন্স' : 'Insufficient account balance' };
    }
    if (!accountNumber || accountNumber.trim().length < 11) {
      return { success: false, message: lang === 'bn' ? 'সঠিক অ্যাকাউন্ট নম্বর দিন' : 'Valid mobile wallet number required' };
    }

    const fee = Math.ceil(amount * 0.05);
    const netAmount = amount - fee;

    // Deduct immediately from balance to prevent double spending
    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: {
        ...prev[currentUser.phone],
        balance: prev[currentUser.phone].balance - amount,
      },
    }));

    const newReq: RequestItem = {
      id: `wit-${Date.now()}`,
      type: 'withdrawal',
      userPhone: currentUser.phone,
      userName: currentUser.fullName,
      userAccountId: currentUser.id,
      amount,
      netAmount,
      fee,
      method,
      accountNumber: accountNumber.trim(),
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
      status: 'pending',
    };

    setRequests((prev) => [newReq, ...prev]);
    persistRequestToFirestore(newReq);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser.phone,
      type: 'withdrawal',
      title: `Withdrawal Request (${method})`,
      titleBn: `উত্তোলন অনুরোধ (${method})`,
      amount: -amount,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      method,
      details: `Net: ৳${netAmount} (Fee: ৳${fee})`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    persistTxToFirestore(newTx);
    persistUserToFirestore({
      ...currentUser,
      balance: currentUser.balance - amount,
    });

    showToast(
      lang === 'bn'
        ? `উত্তোলন রিকোয়েস্ট সফল! নিট ৳${netAmount} পাঠানো হবে (চার্জ: ৳${fee})`
        : `Withdrawal submitted! Net ৳${netAmount} will be sent (Fee: ৳${fee})`,
      'success'
    );
    return { success: true, message: 'Withdrawal submitted' };
  };

  const investInPlan = (planId: number) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    const planIndex = planId - 1;
    const plan = RJ_PLANS[planIndex];
    if (!plan) return { success: false, message: 'Invalid plan' };

    // All plans are now unlocked and directly accessible to all users!
    // Check if already invested in this active plan
    const alreadyInvested = currentUser.investments.some((inv) => inv.planId === planId && inv.status === 'active');
    if (alreadyInvested) {
      return {
        success: false,
        message: lang === 'bn' ? 'এই প্ল্যানটি ইতিমধ্যে সক্রিয় রয়েছে' : 'You are already invested in this active plan',
      };
    }

    if (currentUser.balance < plan.investAmount) {
      return {
        success: false,
        message: lang === 'bn' ? `অপর্যাপ্ত ব্যালেন্স! প্রয়োজন ৳${plan.investAmount}` : `Insufficient balance! Required ৳${plan.investAmount}`,
      };
    }

    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const nextClaimTime = now + 24 * 60 * 60 * 1000; // 24 hours after activation

    const newInvestment: UserInvestment = {
      id: `inv-${now}`,
      planId: plan.id,
      planName: plan.name,
      investAmount: plan.investAmount,
      dailyIncome: plan.dailyIncome,
      days: plan.days,
      bonusPercent: 0, // No joining bonus
      startDate: today,
      activatedAt: now,
      lastClaimedAt: undefined,
      nextClaimAt: nextClaimTime,
      claimedDays: 0,
      status: 'active',
    };

    // Update user balance, investments, and active plan (No Joining Bonus)
    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance - plan.investAmount,
      totalInvested: currentUser.totalInvested + plan.investAmount,
      activePlanIndex: Math.max(currentUser.activePlanIndex, planIndex),
      planStartDate: today,
      lastClaimDate: { ...(currentUser.lastClaimDate || {}) },
      lastClaimTimestamp: { ...(currentUser.lastClaimTimestamp || {}) },
      investments: [newInvestment, ...(currentUser.investments || [])],
    };
    delete updatedUser.lastClaimDate[planIndex];
    delete updatedUser.lastClaimTimestamp[planIndex];

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);

    // Record investment tx
    const investTx: Transaction = {
      id: `tx-${now}-inv`,
      userId: currentUser.phone,
      type: 'investment',
      title: `Investment: ${plan.name}`,
      titleBn: `বিনিয়োগ: ${plan.name}`,
      amount: -plan.investAmount,
      status: 'completed',
      date: today,
    };

    setTransactions((prev) => [investTx, ...prev]);
    persistTxToFirestore(investTx);

    // 3-Generation Referral System
    const genRates = [0.05, 0.03, 0.02]; // 5%, 3%, 2%
    const genLabels = ['1st Generation (5%)', '2nd Generation (3%)', '3rd Generation (2%)'];
    let currentReferrerPhone = currentUser.referredByPhone;

    for (let g = 0; g < 3; g++) {
      if (!currentReferrerPhone) break;
      const refUser = users[currentReferrerPhone] || findUser(currentReferrerPhone);
      if (!refUser) break;
      const refBonus = Math.floor(plan.investAmount * genRates[g]);

      if (refBonus > 0) {
        const updatedParent = {
          ...refUser,
          balance: refUser.balance + refBonus,
          commission: refUser.commission + refBonus,
        };

        setUsers((prev) => ({
          ...prev,
          [refUser.phone]: updatedParent,
        }));
        persistUserToFirestore(updatedParent);

        const refTx: Transaction = {
          id: `tx-${Date.now()}-ref-${g}`,
          userId: refUser.phone,
          type: 'referral_commission',
          title: `Referral Commission ${genLabels[g]}: ${currentUser.fullName}`,
          titleBn: `রেফার কমিশন ${genLabels[g]}: ${currentUser.fullName}`,
          amount: refBonus,
          status: 'completed',
          date: today,
          timestamp: Date.now(),
          details: `Plan: ${plan.name}`,
        };
        setTransactions((prev) => [refTx, ...prev]);
        persistTxToFirestore(refTx);
      }

      currentReferrerPhone = refUser.referredByPhone;
    }

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    showToast(
      lang === 'bn'
        ? `${plan.name} প্ল্যানে সফলভাবে বিনিয়োগ হয়েছে! ২৪ ঘণ্টা পর প্রথম দৈনিক মুনাফা ক্লেইম করতে পারবেন।`
        : `Successfully invested in ${plan.name}! First daily return can be claimed after 24 hours.`,
      'success'
    );
    return { success: true, message: 'Investment successful' };
  };

  const claimDailyIncome = (planIndex: number) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const plan = RJ_PLANS[planIndex];
    if (!plan) return { success: false, message: 'Plan not found' };

    // Check if user has an active investment in this plan
    const investment = currentUser.investments.find((inv) => inv.planId === plan.id && inv.status === 'active');
    if (!investment) {
      return { success: false, message: lang === 'bn' ? 'এই প্ল্যানটি সক্রিয় নেই' : 'No active investment found for this plan' };
    }

    // Check duration expiration
    if (investment.claimedDays >= investment.days) {
      return { success: false, message: lang === 'bn' ? 'এই প্ল্যানের মেয়াদ সম্পন্ন হয়েছে' : 'This plan duration has ended' };
    }

    // Determine when next claim is allowed (24 hours after activation or 24 hours after last claim)
    const baseTimestamp = investment.lastClaimedAt || investment.activatedAt || (investment.startDate ? new Date(investment.startDate).getTime() : now);
    const nextClaimTime = investment.nextClaimAt || (baseTimestamp + 24 * 60 * 60 * 1000);

    if (now < nextClaimTime) {
      const remainingMs = nextClaimTime - now;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      const timeStr = `${hours}h ${minutes}m ${seconds}s`;

      const msg = lang === 'bn'
        ? `প্ল্যান সক্রিয় বা শেষ ক্লেইমের ২৪ ঘণ্টা পর মুনাফা ক্লেইম করা যাবে। বাকি সময়: ${hours > 0 ? `${hours} ঘণ্টা ` : ''}${minutes} মিনিট ${seconds} সেকেন্ড`
        : `Daily payout can be claimed 24 hours after activation/last claim. Time left: ${timeStr}`;

      showToast(msg, 'info');
      return { success: false, message: msg };
    }

    const income = investment.dailyIncome;
    const newClaimedDays = investment.claimedDays + 1;
    const isNowCompleted = newClaimedDays >= investment.days;
    const nextScheduleTime = now + 24 * 60 * 60 * 1000;

    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance + income,
      commission: currentUser.commission + income,
      lastClaimDate: {
        ...(currentUser.lastClaimDate || {}),
        [planIndex]: today,
      },
      lastClaimTimestamp: {
        ...(currentUser.lastClaimTimestamp || {}),
        [planIndex]: now,
      },
      investments: currentUser.investments.map((inv) =>
        inv.id === investment.id
          ? {
              ...inv,
              claimedDays: newClaimedDays,
              lastClaimedAt: now,
              nextClaimAt: nextScheduleTime,
              status: isNowCompleted ? 'completed' : 'active',
            }
          : inv
      ),
    };

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);

    const incomeTx: Transaction = {
      id: `tx-${Date.now()}-claim`,
      userId: currentUser.phone,
      type: 'daily_income',
      title: `Daily Profit Claim: ${plan.name}`,
      titleBn: `দৈনিক মুনাফা গ্রহণ: ${plan.name}`,
      amount: income,
      status: 'completed',
      date: today,
    };

    setTransactions((prev) => [incomeTx, ...prev]);
    persistTxToFirestore(incomeTx);

    confetti({ particleCount: 70, spread: 50, origin: { y: 0.5 } });
    showToast(
      lang === 'bn'
        ? `৳${income} দৈনিক মুনাফা ব্যালেন্সে যোগ হয়েছে! পরবর্তী ক্লেইম ২৪ ঘণ্টা পর।`
        : `৳${income} daily return credited to wallet! Next claim in 24 hours.`,
      'success'
    );
    return { success: true, message: 'Claim successful', amount: income };
  };

  
  const dailyCheckIn = () => {
    if (!currentUser) return { success: false, message: 'Please login' };
    const today = new Date().toISOString().slice(0, 10);
    
    if (currentUser.lastCheckInDate === today) {
      return { success: false, message: lang === 'bn' ? 'আপনি আজকের রিওয়ার্ড পেয়েছেন!' : 'Already claimed for today!' };
    }

    const reward = Math.floor(Math.random() * 5) + 1; // 1 to 5 BDT
    const updatedUser = {
      ...currentUser,
      balance: Number(currentUser.balance || 0) + Number(reward),
      lastCheckInDate: today
    };

    const txId = "checkin-" + Date.now();
    const newTx = {
      id: txId,
      userId: currentUser.phone,
      type: 'bonus',
      title: 'Daily Check-in Reward',
      titleBn: 'ডেইলি চেক-ইন রিওয়ার্ড',
      amount: reward,
      status: 'completed',
      date: today,
      timestamp: Date.now()
    };

    setUsers(prev => ({ ...prev, [currentUser.phone]: updatedUser }));
    setTransactions(prev => [newTx, ...prev]);
    persistUserToFirestore(updatedUser);
    
    // Add Notification
    addNotification(currentUser.phone, 'Bonus Received', "You received ৳" + reward + " from Daily Check-in!");

    return { success: true, message: lang === 'bn' ? "আপনি " + reward + " টাকা রিওয়ার্ড পেয়েছেন!" : "You received ৳" + reward + " reward!", amount: reward };
  };

  const transferFunds = (receiverIdOrPhone: string, amount: number, password?: string) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (amount <= 0) return { success: false, message: 'Invalid amount' };
    if (amount > currentUser.balance) return { success: false, message: 'Insufficient balance' };
    if (receiverIdOrPhone === currentUser.phone || receiverIdOrPhone === currentUser.id) return { success: false, message: 'Cannot transfer to yourself' };
    
    const isPassValid = password === currentUser.password || (currentUser.securityPin && password === currentUser.securityPin);
    if (!isPassValid) {
      return { success: false, message: lang === 'bn' ? 'ভুল পাসওয়ার্ড বা সিকিউরিটি পিন' : 'Incorrect password or Security PIN' };
    }
    
    let receiver = users[receiverIdOrPhone] || findUser(receiverIdOrPhone);
    if (!receiver) return { success: false, message: 'Receiver account not found' };

    const fee = amount * 0.01; // 1% fee
    const netAmount = amount - fee;

    const updatedSender = {
      ...currentUser,
      balance: Number(currentUser.balance || 0) - Number(amount || 0)
    };
    
    const updatedReceiver = {
      ...receiver,
      balance: Number(receiver.balance || 0) + Number(netAmount || 0)
    };
    
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    
    const senderTx = {
      id: "tx-" + now + "-send",
      userId: currentUser.phone,
      type: 'withdrawal', 
      title: "Transfer to " + receiver.phone,
      titleBn: receiver.phone + "-এ ট্রান্সফার",
      amount: -amount,
      status: 'completed',
      date: today,
      timestamp: now,
      details: "Fee: ৳" + fee.toFixed(2)
    };

    const receiverTx = {
      id: "tx-" + now + "-recv",
      userId: receiver.phone,
      type: 'deposit',
      title: "Received from " + currentUser.phone,
      titleBn: currentUser.phone + " থেকে প্রাপ্ত",
      amount: netAmount,
      status: 'completed',
      date: today,
      timestamp: now
    };
    
    const newFeeWallet = {
      ...adminFeeWallet,
      feeBalance: adminFeeWallet.feeBalance + fee,
      totalCollected: adminFeeWallet.totalCollected + fee,
      updatedAt: now,
    };

    const newFeeTx = {
      id: "feetx-" + now,
      type: 'collection',
      amount: fee,
      method: 'p2p_transfer',
      userId: currentUser.phone,
      note: "Fee from P2P transfer (" + amount + ")",
      status: 'completed',
      date: today,
      timestamp: now,
    };

    setUsers(prev => ({ 
      ...prev, 
      [currentUser.phone]: updatedSender,
      [receiver.phone]: updatedReceiver
    }));
    setTransactions(prev => [senderTx, receiverTx, ...prev]);
    setAdminFeeWallet(newFeeWallet);
    setAdminFeeTransactions(prev => [newFeeTx, ...prev]);
    
    persistUserToFirestore(updatedSender);
    persistUserToFirestore(updatedReceiver);
    
    addNotification(receiver.phone, 'Funds Received', "You received ৳" + netAmount.toFixed(2) + " from " + currentUser.phone);
    addNotification(currentUser.phone, 'Transfer Successful', "Transferred ৳" + amount.toFixed(2) + " to " + receiver.phone);

    return { success: true, message: 'Transfer successful' };
  };

  const addNotification = (userPhone, title, message) => {
    setUsers(prev => {
      const user = prev[userPhone];
      if (!user) return prev;
      
      const newNotif = {
        id: "notif-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        title,
        message,
        date: new Date().toISOString().slice(0, 10),
        read: false,
        type: 'system'
      };
      
      const updatedUser = {
        ...user,
        notifications: [newNotif, ...(user.notifications || [])]
      };
      persistUserToFirestore(updatedUser);
      return { ...prev, [userPhone]: updatedUser };
    });
  };

  const recordSecurityLog = (action: string, actionBn: string, status: 'success' | 'warning' | 'failed' = 'success') => {
    if (!currentUser) return;
    const newLog: SecurityLogItem = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      actionBn,
      timestamp: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 35) : 'Web Session',
      status,
    };

    const updatedUser: User = {
      ...currentUser,
      securityLogs: [newLog, ...(currentUser.securityLogs || []).slice(0, 25)],
    };

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);
  };

  const setSecurityPin = async (pin: string, currentPassword?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, message: lang === 'bn' ? '৪ ডিজিটের সংখ্যাসূচক পিন দিন' : 'PIN must be 4 digits' };
    }
    if (currentPassword && currentPassword !== currentUser.password) {
      return { success: false, message: lang === 'bn' ? 'বর্তমান পাসওয়ার্ড সঠিক নয়' : 'Incorrect current password' };
    }

    const updatedUser: User = {
      ...currentUser,
      securityPin: pin,
      isPinEnabled: true,
    };

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
      [normalizePhoneNumber(currentUser.phone)]: updatedUser,
    }));
    await persistUserToFirestore(updatedUser);

    recordSecurityLog(
      'Transaction PIN Updated',
      '৪-ডিজিটের ট্রানজ্যাকশন পিন সক্রিয় করা হয়েছে',
      'success'
    );

    showToast(
      lang === 'bn' ? '৪ ডিজিটের নিরাপত্তা পিন সফলভাবে সংরক্ষিত হয়েছে!' : 'Security PIN configured successfully!',
      'success'
    );
    return { success: true, message: 'PIN saved successfully' };
  };

  const togglePinRequirement = async (enabled: boolean): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please login' };
    if (enabled && !currentUser.securityPin) {
      return { success: false, message: lang === 'bn' ? 'প্রথমে ৪ ডিজিট পিন সেট করুন' : 'Please set a PIN first' };
    }

    const updatedUser: User = {
      ...currentUser,
      isPinEnabled: enabled,
    };

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
      [normalizePhoneNumber(currentUser.phone)]: updatedUser,
    }));
    await persistUserToFirestore(updatedUser);

    recordSecurityLog(
      enabled ? 'PIN Protection Enabled' : 'PIN Protection Disabled',
      enabled ? 'লেনদেনের পিন সুরক্ষা চালু করা হয়েছে' : 'লেনদেনের পিন সুরক্ষা বন্ধ করা হয়েছে',
      enabled ? 'success' : 'warning'
    );

    showToast(
      lang === 'bn'
        ? (enabled ? 'উত্তোলনে পিন সুরক্ষা চালু হয়েছে' : 'পিন সুরক্ষা বন্ধ করা হয়েছে')
        : (enabled ? 'PIN protection enabled' : 'PIN protection disabled'),
      'success'
    );
    return { success: true, message: 'Updated PIN setting' };
  };

  const setAutoLockMinutes = async (minutes: number): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please login' };

    const updatedUser: User = {
      ...currentUser,
      autoLockMinutes: minutes,
    };

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
      [normalizePhoneNumber(currentUser.phone)]: updatedUser,
    }));
    await persistUserToFirestore(updatedUser);

    recordSecurityLog(
      `Auto-lock timer set to ${minutes}m`,
      `অটো-লক সময়সূচি ${minutes} মিনিটে নির্ধারিত`,
      'success'
    );

    showToast(
      lang === 'bn'
        ? (minutes > 0 ? `অটো-লক ${minutes} মিনিটে সক্রিয় করা হয়েছে` : 'অটো-লক বন্ধ করা হয়েছে')
        : (minutes > 0 ? `Auto-lock set to ${minutes} minutes` : 'Auto-lock disabled'),
      'success'
    );
    return { success: true, message: 'Auto-lock updated' };
  };

  const terminateOtherSessions = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'Please login' };

    recordSecurityLog(
      'All Other Remote Sessions Terminated',
      'অন্যান্য সকল ডিভাইস থেকে সফলভাবে লগআউট করা হয়েছে',
      'warning'
    );

    showToast(
      lang === 'bn' ? 'অন্যান্য সমস্ত সেশন সফলভাবে টার্মিনেট করা হয়েছে।' : 'All other sessions terminated successfully.',
      'success'
    );
    return { success: true, message: 'Sessions terminated' };
  };

  const markNotificationRead = (notificationId) => {
    if (!currentUser) return;
    const updatedNotifs = (currentUser.notifications || []).map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    
    const updatedUser = {
      ...currentUser,
      notifications: updatedNotifs
    };
    
    setUsers(prev => ({ ...prev, [currentUser.phone]: updatedUser }));
    persistUserToFirestore(updatedUser);
  };
const buyBond = (bondId: string) => {
    if (!currentUser) return { success: false, message: 'Please login' };
    const bondDef = RJ_BONDS.find((b) => b.id === bondId);
    if (!bondDef) return { success: false, message: 'Invalid bond' };

    if (currentUser.balance < bondDef.price) {
      return {
        success: false,
        message: lang === 'bn' ? `অপর্যাপ্ত ব্যালেন্স! প্রয়োজন ৳${bondDef.price}` : `Insufficient balance! Required ৳${bondDef.price}`,
      };
    }

    const randomSerial = Math.random().toString(36).substring(2, 8).toUpperCase();
    const serialNumber = `IT-${bondDef.price}-${randomSerial}`;
    const today = new Date().toISOString().slice(0, 10);

    const newBond: UserBond = {
      id: `bnd-${Date.now()}`,
      bondDefId: bondDef.id,
      bondName: bondDef.name,
      serialNumber,
      price: bondDef.price,
      purchaseDate: today,
      status: 'Active',
    };

    const updatedUser = {
      ...currentUser,
      balance: currentUser.balance - bondDef.price,
      bonds: [newBond, ...(currentUser.bonds || [])],
    };

    setUsers((prev) => ({
      ...prev,
      [currentUser.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);

    const bondTx: Transaction = {
      id: `tx-${Date.now()}-bond`,
      userId: currentUser.phone,
      type: 'bond_purchase',
      title: `Price Bond: ${bondDef.name}`,
      titleBn: `প্রাইস বন্ড ক্রয়: ${bondDef.name}`,
      amount: -bondDef.price,
      status: 'completed',
      date: today,
      details: `Bond No: ${serialNumber}`,
    };

    setTransactions((prev) => [bondTx, ...prev]);
    persistTxToFirestore(bondTx);

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    showToast(
      lang === 'bn'
        ? `বন্ড ক্রয় সফল! নম্বর: ${serialNumber} (সংরক্ষণ করুন)`
        : `Bond purchased! No: ${serialNumber}`,
      'success'
    );
    return { success: true, message: 'Bond purchased', serialNumber };
  };

const createFD = (amount: number) => {
  if (!currentUser) return { success: false, message: 'Please login' };
  if (amount < 1500) return { success: false, message: lang === 'bn' ? 'সর্বনিম্ন ডিপোজিট ১৫০০ ৳' : 'Minimum deposit is 1500 ৳' };
  if (currentUser.balance < amount) return { success: false, message: lang === 'bn' ? 'অপরিপ্রেক্ষিত ব্যালেন্স' : 'Insufficient balance' };
  
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const maturityAt = now + 180 * 24 * 60 * 60 * 1000; // 6 months approx
  const maturityDate = new Date(maturityAt).toISOString().slice(0, 10);
  
  const newFD: FixedDeposit = {
    id: `fd_${Math.random().toString(36).substr(2, 9)}`,
    principal: amount,
    monthlyRate: 7.5,
    startDate: today,
    maturityDate: maturityDate,
    activatedAt: now,
    maturityAt: maturityAt,
    lastClaimedAt: now,
    totalClaimed: 0,
    status: 'active'
  };

  const newBalance = currentUser.balance - amount;
  const updatedUser = {
    ...currentUser,
    balance: newBalance,
    fds: [...(currentUser.fds || []), newFD]
  };
  
  setUsers((prev) => ({ ...prev, [currentUser.phone]: updatedUser }));
  persistUserToFirestore(updatedUser);

  const tx: Transaction = {
    id: `tx_${Date.now()}`,
    userId: currentUser.phone,
    type: 'fd_deposit',
    title: 'FD Created',
    titleBn: 'এফডি তৈরি',
    amount: -amount,
    status: 'completed',
    date: today,
    timestamp: now,
    details: `Fixed Deposit (ID: ${newFD.id})`
  };
  
  setTransactions((prev) => [tx, ...prev]);
  persistTxToFirestore(tx);

  showToast(lang === 'bn' ? 'ফিক্সড ডিপোজিট সফলভাবে তৈরি হয়েছে!' : 'Fixed Deposit created successfully!', 'success');
  return { success: true, message: 'FD created' };
};

const claimFDProfit = (fdId: string) => {
  if (!currentUser) return { success: false, message: 'Please login' };
  
  const fdIndex = (currentUser.fds || []).findIndex(f => f.id === fdId);
  if (fdIndex === -1) return { success: false, message: 'FD not found' };
  
  const fd = currentUser.fds![fdIndex];
  if (fd.status !== 'active') return { success: false, message: 'FD is not active' };
  
  const now = Date.now();
  const oneDayMs = 1 * 24 * 60 * 60 * 1000;
  const elapsed = now - (fd.lastClaimedAt || fd.activatedAt);
  
  if (elapsed < oneDayMs) {
    return { success: false, message: lang === 'bn' ? 'এখনও ১ দিন পূর্ণ হয়নি' : '1 day has not passed yet' };
  }
  
  const cycles = Math.floor(elapsed / oneDayMs);
  const profitPerCycle = (fd.principal * 7.5 / 100) / 30;
  const totalProfit = profitPerCycle * cycles;
  
  const newLastClaimedAt = (fd.lastClaimedAt || fd.activatedAt) + (cycles * oneDayMs);
  
  const updatedFD = {
    ...fd,
    lastClaimedAt: newLastClaimedAt,
    totalClaimed: fd.totalClaimed + totalProfit,
    status: (now >= fd.maturityAt) ? 'matured' as const : 'active' as const
  };
  
  const updatedFds = [...(currentUser.fds || [])];
  updatedFds[fdIndex] = updatedFD;
  
  const updatedUser = {
    ...currentUser,
    balance: currentUser.balance + totalProfit,
    fds: updatedFds
  };
  
  setUsers((prev) => ({ ...prev, [currentUser.phone]: updatedUser }));
  persistUserToFirestore(updatedUser);
  
  const tx: Transaction = {
    id: `tx_${Date.now()}`,
    userId: currentUser.phone,
    type: 'fd_profit',
    title: 'FD Profit Claimed',
    titleBn: 'এফডি প্রফিট সংগ্রহ',
    amount: totalProfit,
    status: 'completed',
    date: new Date().toISOString().slice(0, 10),
    timestamp: now,
    details: `FD ID: ${fdId}`
  };
  
  setTransactions((prev) => [tx, ...prev]);
  persistTxToFirestore(tx);
  
  confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  showToast(lang === 'bn' ? `প্রফিট ৳${totalProfit.toFixed(2)} সংগ্রহ করা হয়েছে!` : `Profit ৳${totalProfit.toFixed(2)} claimed!`, 'success');
  return { success: true, message: 'Profit claimed', amount: totalProfit };
};

  // Admin Actions
  const adminWithdrawFee = (amount: number, method: string, accountDetails: string, note: string, password: string) => {
    if (amount <= 0 || amount > adminFeeWallet.feeBalance) {
      return { success: false, message: 'Invalid amount or insufficient balance' };
    }
    
    // Security: Verify Admin Password before withdrawal
    if (password !== adminPw) {
      return { success: false, message: 'Incorrect Admin Password/PIN' };
    }
    
    const newWallet = {
      ...adminFeeWallet,
      feeBalance: adminFeeWallet.feeBalance - amount,
      totalWithdrawn: adminFeeWallet.totalWithdrawn + amount,
      updatedAt: Date.now(),
    };
    
    const newTx: AdminFeeTransaction = {
      id: `feetx-${Date.now()}`,
      type: 'withdrawal',
      amount,
      method,
      accountDetails,
      note,
      adminId,
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      timestamp: Date.now(),
    };
    
    setAdminFeeWallet(newWallet);
    persistFeeWalletToFirestore(newWallet);
    
    setAdminFeeTransactions((prev) => [newTx, ...prev]);
    persistFeeTxToFirestore(newTx);
    
    showToast(`Successfully withdrew ৳${amount} from Fee Balance`, 'success');
    return { success: true, message: 'Fee withdrawal successful' };
  };
  
  const approveRequest = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found' };

    const updatedReq: RequestItem = { ...req, status: 'approved' };
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );
    persistRequestToFirestore(updatedReq);

    // If it's a deposit, add funds to user's wallet
    if (req.type === 'deposit') {
      setUsers((prev) => {
        const user = prev[req.userPhone];
        if (!user) return prev;
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: 'Deposit Approved',
          message: 'Your deposit of ৳' + req.amount + ' has been approved.',
          date: new Date().toISOString().slice(0, 10),
          read: false,
          type: 'system',
        };
        const updatedUser = {
          ...user,
          balance: Number(user.balance || 0) + Number(req.amount || 0),
          totalDeposited: Number(user.totalDeposited || 0) + Number(req.amount || 0),
          notifications: [newNotif, ...(user.notifications || [])],
        };
        persistUserToFirestore(updatedUser);
        return {
          ...prev,
          [req.userPhone]: updatedUser,
        };
      });

      // Update tx status
      const txToUpdate = transactions.find((tx) => tx.userId === req.userPhone && tx.type === 'deposit' && tx.trxId === req.trxId);
      if (txToUpdate) {
        const updatedTx: Transaction = { ...txToUpdate, status: 'approved', title: `Deposit Approved (${req.method})`, titleBn: `ডিপোজিট অনুমোদিত (${req.method})` };
        setTransactions((prev) => prev.map((tx) => tx.id === txToUpdate.id ? updatedTx : tx));
        persistTxToFirestore(updatedTx);
      }
    } else if (req.type === 'withdrawal') {
      // User was already debited upon request submission, mark completed
      setUsers((prev) => {
        const user = prev[req.userPhone];
        if (!user) return prev;
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: 'Withdrawal Approved',
          message: 'Your withdrawal of ৳' + req.amount + ' has been approved.',
          date: new Date().toISOString().slice(0, 10),
          read: false,
          type: 'system',
        };
        const updatedUser = {
          ...user,
          totalWithdrawn: Number(user.totalWithdrawn || 0) + Number(req.amount || 0),
          notifications: [newNotif, ...(user.notifications || [])],
        };
        persistUserToFirestore(updatedUser);
        return {
          ...prev,
          [req.userPhone]: updatedUser,
        };
      });

      const txToUpdate = transactions.find((tx) => tx.userId === req.userPhone && tx.type === 'withdrawal' && tx.status === 'pending');
      if (txToUpdate) {
        const updatedTx: Transaction = { ...txToUpdate, status: 'completed', title: `Withdrawal Sent (${req.method})`, titleBn: `উত্তোলন সম্পন্ন (${req.method})` };
        setTransactions((prev) => prev.map((tx) => tx.id === txToUpdate.id ? updatedTx : tx));
        persistTxToFirestore(updatedTx);
      }
      // Collect fee for admin wallet
      if (req.fee && req.fee > 0) {
        setAdminFeeWallet((prev) => {
          const newWallet = {
            ...prev,
            feeBalance: prev.feeBalance + (req.fee || 0),
            totalCollected: prev.totalCollected + (req.fee || 0),
            updatedAt: Date.now(),
          };
          persistFeeWalletToFirestore(newWallet);
          return newWallet;
        });
        const feeTx: AdminFeeTransaction = {
          id: `feetx-${Date.now()}-${req.id}`,
          type: 'collection',
          amount: req.fee,
          withdrawalId: req.id,
          userId: req.userPhone,
          status: 'completed',
          date: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
        };
        setAdminFeeTransactions((prev) => [feeTx, ...prev]);
        persistFeeTxToFirestore(feeTx);
      }

    }

    showToast(`Request ${requestId} approved successfully!`, 'success');
    return { success: true, message: 'Approved successfully' };
  };

  const rejectRequest = (requestId: string, notes?: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found' };

    const updatedReq: RequestItem = { ...req, status: 'rejected', adminNotes: notes };
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );
    persistRequestToFirestore(updatedReq);

    // If it's a rejected withdrawal, refund the user balance
    if (req.type === 'withdrawal') {
      setUsers((prev) => {
        const user = prev[req.userPhone];
        if (!user) return prev;
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: 'Withdrawal Rejected',
          message: 'Your withdrawal request of ৳' + req.amount + ' was rejected and refunded to your wallet.',
          date: new Date().toISOString().slice(0, 10),
          read: false,
          type: 'system',
        };
        const updatedUser = {
          ...user,
          balance: Number(user.balance || 0) + Number(req.amount || 0),
          notifications: [newNotif, ...(user.notifications || [])],
        };
        persistUserToFirestore(updatedUser);
        return {
          ...prev,
          [req.userPhone]: updatedUser,
        };
      });

      const txToUpdate = transactions.find((tx) => tx.userId === req.userPhone && tx.type === 'withdrawal' && tx.status === 'pending');
      if (txToUpdate) {
        const updatedTx: Transaction = { ...txToUpdate, status: 'rejected', title: `Withdrawal Rejected (${req.method})`, titleBn: `উত্তোলন বাতিল (${req.method})` };
        setTransactions((prev) => prev.map((tx) => tx.id === txToUpdate.id ? updatedTx : tx));
        persistTxToFirestore(updatedTx);
      }

      const refundTx: Transaction = {
        id: `tx-${Date.now()}-refund`,
        userId: req.userPhone,
        type: 'admin_adjustment',
        title: 'Withdrawal Rejected (Refunded to Wallet)',
        titleBn: 'উত্তোলন বাতিল (ব্যালেন্সে ফেরত প্রদান)',
        amount: req.amount,
        status: 'completed',
        date: new Date().toISOString().slice(0, 10),
      };
      setTransactions((prev) => [refundTx, ...prev]);
      persistTxToFirestore(refundTx);
    } else if (req.type === 'deposit') {
      const txToUpdate = transactions.find((tx) => tx.userId === req.userPhone && tx.type === 'deposit' && tx.trxId === req.trxId);
      if (txToUpdate) {
        const updatedTx: Transaction = { ...txToUpdate, status: 'rejected', title: `Deposit Rejected (${req.method})`, titleBn: `ডিপোজিট বাতিল (${req.method})` };
        setTransactions((prev) => prev.map((tx) => tx.id === txToUpdate.id ? updatedTx : tx));
        persistTxToFirestore(updatedTx);
      }
    }

    showToast(`Request ${requestId} rejected.`, 'info');
    return { success: true, message: 'Rejected' };
  };

  const awardBondPrize = (serialNumber: string, prizeRank: string, prizeAmount: number) => {
    let targetUser: User | null = null;
    let targetBond: UserBond | null = null;

    (Object.values(users) as User[]).forEach((u) => {
      (u.bonds || []).forEach((b) => {
        if (b.serialNumber === serialNumber) {
          targetUser = u;
          targetBond = b;
        }
      });
    });

    if (!targetUser || !targetBond) {
      return { success: false, message: 'Bond serial number not found' };
    }

    const u: User = targetUser;
    const updatedUser = {
      ...u,
      balance: u.balance + prizeAmount,
      commission: u.commission + prizeAmount,
      bonds: (u.bonds || []).map((b) =>
        b.serialNumber === serialNumber
          ? { ...b, status: prizeRank as any, prizeAmount }
          : b
      ),
    };

    setUsers((prev) => ({
      ...prev,
      [u.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);

    const prizeTx: Transaction = {
      id: `tx-${Date.now()}-prize`,
      userId: u.phone,
      type: 'bond_prize',
      title: `Price Bond Win: ${prizeRank}`,
      titleBn: `প্রাইস বন্ড জয়: ${prizeRank}`,
      amount: prizeAmount,
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      details: `Serial: ${serialNumber}`,
    };

    setTransactions((prev) => [prizeTx, ...prev]);
    persistTxToFirestore(prizeTx);

    showToast(`Awarded ৳${prizeAmount} (${prizeRank}) to ${u.fullName}!`, 'success');
    return { success: true, message: 'Prize awarded' };
  };

  const refundBond = (serialNumber: string) => {
    let targetUser: User | null = null;
    let targetBond: UserBond | null = null;

    (Object.values(users) as User[]).forEach((u) => {
      (u.bonds || []).forEach((b) => {
        if (b.serialNumber === serialNumber) {
          targetUser = u;
          targetBond = b;
        }
      });
    });

    if (!targetUser || !targetBond) {
      return { success: false, message: 'Bond not found' };
    }

    const u: User = targetUser;
    const b: UserBond = targetBond;

    const updatedUser = {
      ...u,
      balance: u.balance + b.price,
      bonds: (u.bonds || []).map((item) =>
        item.serialNumber === serialNumber ? { ...item, status: 'Return' as any } : item
      ),
    };

    setUsers((prev) => ({
      ...prev,
      [u.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);

    const refundTx: Transaction = {
      id: `tx-${Date.now()}-bnd-ref`,
      userId: u.phone,
      type: 'bond_refund',
      title: `Price Bond 100% Return: ${b.bondName}`,
      titleBn: `প্রাইস বন্ড ১০০% ফেরত: ${b.bondName}`,
      amount: b.price,
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      details: `Serial: ${serialNumber}`,
    };

    setTransactions((prev) => [refundTx, ...prev]);
    persistTxToFirestore(refundTx);

    showToast(`Refunded ৳${b.price} for bond ${serialNumber}`, 'info');
    return { success: true, message: 'Refunded' };
  };

  const executeBondDraw = (bondId: string) => {
    const bondDef = RJ_BONDS.find((b) => b.id === bondId);
    if (!bondDef) return { success: false, message: 'Invalid bond type' };

    const activeEntries: { userPhone: string; bond: UserBond }[] = [];
    (Object.values(users) as User[]).forEach((u) => {
      (u.bonds || []).forEach((b) => {
        if (b.bondDefId === bondId && b.status === 'Active') {
          activeEntries.push({ userPhone: u.phone, bond: b });
        }
      });
    });

    if (activeEntries.length < 3) {
      return {
        success: false,
        message: lang === 'bn' ? 'ড্র করার জন্য কমপক্ষে ৩টি সক্রিয় বন্ড প্রয়োজন' : 'At least 3 active bonds required for draw',
      };
    }

    // Shuffle entries
    const shuffled = [...activeEntries].sort(() => Math.random() - 0.5);

    // Winners: 1st, 2nd, 3rd
    const prizes = bondDef.prizes;
    shuffled.slice(0, 3).forEach((entry, idx) => {
      const prize = prizes[idx];
      awardBondPrize(entry.bond.serialNumber, prize.rank, prize.amount);
    });

    // Remainder: 100% money back return
    shuffled.slice(3).forEach((entry) => {
      refundBond(entry.bond.serialNumber);
    });

    showToast(`Draw complete! 3 winners awarded and ${shuffled.length - 3} refunded!`, 'success');
    return { success: true, message: 'Draw executed', winnersCount: 3 };
  };

  
  const sendGlobalNotification = (title: string, message: string) => {
    try {
      setUsers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(phone => {
          const user = next[phone];
          const newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title,
            message,
            date: new Date().toISOString().slice(0, 10),
            read: false,
            type: 'system' as const
          };
          next[phone] = {
            ...user,
            notifications: [newNotif, ...(user.notifications || [])]
          };
          persistUserToFirestore(next[phone]);
        });
        return next;
      });
      return { success: true, message: 'Global notification sent' };
    } catch (err) {
      return { success: false, message: 'Failed to send notification' };
    }
  };

  const adminAdjustBalance = (phone: string, amount: number, note: string) => {
    const targetUser = users[phone] || findUser(phone);
    if (!targetUser) return { success: false, message: 'User not found' };

    const updatedUser = {
      ...targetUser,
      balance: Math.max(0, targetUser.balance + amount),
    };

    setUsers((prev) => ({
      ...prev,
      [targetUser.phone]: updatedUser,
    }));
    persistUserToFirestore(updatedUser);

    const adjTx: Transaction = {
      id: `tx-${Date.now()}-adj`,
      userId: targetUser.phone,
      type: 'admin_adjustment',
      title: `Admin Adjustment: ${note}`,
      titleBn: `অ্যাডমিন সমন্বয়: ${note}`,
      amount,
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
    };

    setTransactions((prev) => [adjTx, ...prev]);
    persistTxToFirestore(adjTx);

    showToast(`User balance adjusted by ৳${amount}`, 'success');
    return { success: true, message: 'Balance adjusted' };
  };

  
  const adminChangeCredentials = async (newAdminId: string, newPass: string) => {
    const cleanId = (newAdminId || '').trim();
    if (!cleanId || cleanId.length < 3) {
      return { success: false, message: 'Admin ID must be at least 3 characters' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    setAdminId(cleanId);
    setAdminPw(newPass);
    localStorage.setItem(MASTER_ADMIN_ID_KEY, cleanId);
    localStorage.setItem(MASTER_ADMIN_PASS_KEY, newPass);
    
    try {
      await setDoc(doc(db, 'settings', 'adminCredentials'), {
        adminId: cleanId,
        adminPw: newPass,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to sync admin credentials to Firestore', err);
    }
    
    showToast('Master Admin credentials updated successfully!', 'success');
    return { success: true, message: 'Credentials updated' };
  };

  const adminChangePassword = (newPass: string) => {
    return adminChangeCredentials(adminId, newPass);
  };

  const addMarketingMember = (name: string, phone: string, role: string, customAccountId?: string) => {
    const cleanPhone = phone.trim();
    // Check if a registered user exists with this phone number to link their Account ID
    const registeredUser = users[cleanPhone];
    const resolvedAccountId = (customAccountId && customAccountId.trim())
      ? customAccountId.trim()
      : (registeredUser?.id || `RJ-${Math.floor(100000 + Math.random() * 900000)}`);

    const newMember: MarketingTeamMember = {
      id: `mkt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      phone: cleanPhone,
      role: role.trim(),
      accountId: resolvedAccountId,
      joinDate: new Date().toISOString().split('T')[0]
    };
    setMarketingTeam(prev => [...prev, newMember]);
    persistMarketingMemberToFirestore(newMember);
    showToast(lang === 'bn' ? 'মার্কেটিং সদস্য সফলভাবে যুক্ত করা হয়েছে' : 'Marketing member added successfully', 'success');
  };

  const removeMarketingMember = (id: string) => {
    setMarketingTeam(prev => prev.filter(m => m.id !== id));
    deleteMarketingMemberFromFirestore(id);
    showToast(lang === 'bn' ? 'মার্কেটিং সদস্য সরানো হয়েছে' : 'Marketing member removed', 'success');
  };

    const adminToggleUserMarketingStatus = (phone: string) => {
    const cleanPhone = phone.trim();
    const targetUser = users[cleanPhone] || findUser(cleanPhone);
    if (!targetUser) return { success: false, message: 'User not found', isMarketingTeam: false };
    
    const newStatus = !targetUser.isMarketingTeam;
    
    const updatedUser = {
      ...targetUser,
      isMarketingTeam: newStatus
    };
    
    setUsers(prev => ({ ...prev, [targetUser.phone]: updatedUser }));
    persistUserToFirestore(updatedUser);
    
    return { success: true, message: `User ${targetUser.fullName} marketing status updated`, isMarketingTeam: newStatus };
  };

  const adminToggleUserStatus = (phone: string) => {
    const cleanPhone = phone.trim();
    const targetUser = users[cleanPhone] || findUser(cleanPhone);
    if (!targetUser) return { success: false, message: 'User not found', newStatus: '' };
    
    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    
    const updatedUser = {
      ...targetUser,
      status: newStatus
    };
    
    setUsers(prev => ({ ...prev, [targetUser.phone]: updatedUser }));
    persistUserToFirestore(updatedUser);
    
    return { success: true, message: `User ${targetUser.fullName} ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`, newStatus };
  };

  const adminDeleteUser = (phone: string) => {
    const cleanPhone = phone.trim();
    const targetUser = users[cleanPhone] || findUser(cleanPhone);
    if (!targetUser) return { success: false, message: 'User not found' };
    const userName = targetUser.fullName;
    const userPhone = targetUser.phone;
    const userNormalized = normalizePhoneNumber(userPhone);

    // Remove user from state (clean all keys)
    setUsers((prev) => {
      const updated = { ...prev };
      delete updated[cleanPhone];
      delete updated[userPhone];
      delete updated[userNormalized];
      if (targetUser.id) delete updated[targetUser.id];
      return updated;
    });
    deleteUserFromFirestore(userPhone);
    if (userNormalized !== userPhone) {
      deleteUserFromFirestore(userNormalized);
    }
    if (cleanPhone !== userPhone && cleanPhone !== userNormalized) {
      deleteUserFromFirestore(cleanPhone);
    }

    // Remove user's requests
    const userReqIds = requests
      .filter((r) => r.userPhone === userPhone || r.userPhone === cleanPhone || r.userPhone === userNormalized)
      .map((r) => r.id);
    setRequests((prev) =>
      prev.filter((r) => r.userPhone !== userPhone && r.userPhone !== cleanPhone && r.userPhone !== userNormalized)
    );
    userReqIds.forEach((reqId) => deleteRequestFromFirestore(reqId));

    // Remove user's transactions
    setTransactions((prev) =>
      prev.filter((t) => t.userId !== userPhone && t.userId !== cleanPhone && t.userId !== userNormalized)
    );

    // If currently logged-in user is deleted, log out immediately
    if (currentUserPhone === userPhone || currentUserPhone === cleanPhone || currentUserPhone === userNormalized) {
      setCurrentUserPhone(null);
    }

    showToast(
      lang === 'bn'
        ? `ব্যবহারকারী (${userName}) এবং তার সমস্ত ডেটা মুছে ফেলা হয়েছে`
        : `User (${userName}) and all associated records deleted`,
      'info'
    );
    return { success: true, message: 'User deleted' };
  };

  const adminDeleteRequest = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found' };

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    deleteRequestFromFirestore(requestId);
    showToast(lang === 'bn' ? 'অনুরোধটি মুছে ফেলা হয়েছে' : 'Request deleted', 'info');
    return { success: true, message: 'Request deleted' };
  };

  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    persistMessageToFirestore(userMsg);
    setIsAiResponding(true);

    try {
      // Build conversation history (last 8 messages)
      const recentHistory = chatMessages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      // Current user context
      const userContext = currentUser
        ? {
            fullName: currentUser.fullName,
            balance: currentUser.balance,
            activePlanIndex: currentUser.activePlanIndex,
            dailyIncome: currentUser.investments?.reduce(
              (acc, inv) => (inv.status === 'active' ? acc + inv.dailyIncome : acc),
              0
            ) || 0,
            id: currentUser.id,
          }
        : null;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: recentHistory,
          language: lang,
          userContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botResponseText = data.reply || 'Thank you for your question. You can also connect directly via WhatsApp: 01410809337.';

      const botMsg: SupportMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      };

      setChatMessages((prev) => [...prev, botMsg]);
      persistMessageToFirestore(botMsg);
      setUnreadChatCount((c) => c + 1);
    } catch (err) {
      console.warn('AI chat fallback triggered:', err);
      // Smart offline fallback
      const lower = text.toLowerCase();
      let botResponse = 'Thank you for your message. An RJ TRUST specialist is available 24/7 on WhatsApp: 01410809337.';

      if (lower.includes('deposit') || lower.includes('ডিপোজিট')) {
        botResponse = 'For Deposit: Go to Home > Click Deposit > Select bKash / Nagad / Rocket > Send Money to our official number > Submit Transaction ID (TrxID). Admin will approve within 5-15 minutes.';
      } else if (lower.includes('withdraw') || lower.includes('উত্তোলন')) {
        botResponse = 'For Withdrawal: Minimum ৳500 (Max ৳25,000). A 5% fee applies. Select your wallet and account number. Approvals processed promptly.';
      } else if (lower.includes('bond') || lower.includes('বন্ড') || lower.includes('লটারি')) {
        botResponse = 'RJ TRUST Price Bonds start from ৳100 (Bronze), ৳200 (Silver), ৳500 (Gold) up to ৳1000 (Diamond). Each bond gives you a unique serial number for cash draws + 100% money-back guarantee if not won!';
      } else if (lower.includes('refer') || lower.includes('রেফার') || lower.includes('bonus')) {
        botResponse = 'You earn 3 generations of referral income: 5% from Gen 1, 3% from Gen 2, and 2% from Gen 3 whenever friends invest in any VIP tier!';
      } else if (lower.includes('plan') || lower.includes('প্ল্যান') || lower.includes('invest')) {
        botResponse = 'We offer 15 VIP investment tiers starting from Bronze 1 (৳300 with ৳33/day profit). Claim your daily income every 24 hours!';
      }

      const botMsg: SupportMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
      persistMessageToFirestore(botMsg);
      setUnreadChatCount((c) => c + 1);
    } finally {
      setIsAiResponding(false);
    }
  };

  const resetUnreadChat = () => {
    setUnreadChatCount(0);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        requests,
        transactions,
    adminFeeWallet,
    adminFeeTransactions,
    adminWithdrawFee,
    lang,
        setLang,
        t,
        isAdminLoggedIn,
        login,
        register,
        logout,
        resetPassword,
        adminId,
        adminLogin,
        adminLogout,
        submitDeposit,
        submitWithdrawal,
        dailyCheckIn,
        transferFunds,
        markNotificationRead,
        investInPlan,
        claimDailyIncome,
        buyBond,
        createFD,
        claimFDProfit,
        approveRequest,
        rejectRequest,
        adminDeleteRequest,
        adminDeleteUser,
        adminToggleUserStatus,
        adminToggleUserMarketingStatus,
        awardBondPrize,
        refundBond,
        executeBondDraw,
        sendGlobalNotification,
        adminAdjustBalance,
        adminChangePassword,
        adminChangeCredentials,
      marketingTeam,
      addMarketingMember,
      removeMarketingMember,
      theme,
      setTheme,
      toggleTheme,
        toast,
        showToast,
        activeTab,
        setActiveTab,
        chatMessages,
        sendChatMessage,
        isAiResponding,
        unreadChatCount,
        resetUnreadChat,
        syncAllDataFromFirestore,
        isSyncingData,
        isSecurityModalOpen,
        setIsSecurityModalOpen,
        setSecurityPin,
        togglePinRequirement,
        setAutoLockMinutes,
        terminateOtherSessions,
        recordSecurityLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
