import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, Transaction, RequestItem, InvestmentPlan, PriceBondDef, SupportMessage, NotificationItem, UserInvestment, UserBond, AdminFeeWallet, AdminFeeTransaction , MarketingTeamMember} from '../types';
import { RJ_PLANS, RJ_BONDS, TRANSLATIONS } from '../data/constants';

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
  login: (phone: string, password: string) => { success: boolean; message: string };
  register: (fullName: string, phone: string, password: string, referralCode?: string) => { success: boolean; message: string };
  logout: () => void;
  resetPassword: (phone: string, verificationValue: string, newPass: string, verifyType?: 'id' | 'name' | 'otp') => { success: boolean; message: string };
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
  // Admin Operations
  approveRequest: (requestId: string) => { success: boolean; message: string };
  rejectRequest: (requestId: string, notes?: string) => { success: boolean; message: string };
  adminDeleteRequest: (requestId: string) => { success: boolean; message: string };
  adminDeleteUser: (phone: string) => { success: boolean; message: string };
  adminToggleUserStatus: (phone: string) => { success: boolean; message: string; newStatus: string };
  awardBondPrize: (serialNumber: string, prizeRank: string, prizeAmount: number) => { success: boolean; message: string };
  refundBond: (serialNumber: string) => { success: boolean; message: string };
  executeBondDraw: (bondId: string) => { success: boolean; message: string; winnersCount?: number };
  adminAdjustBalance: (phone: string, amount: number, note: string) => { success: boolean; message: string };
  sendGlobalNotification: (title: string, message: string) => { success: boolean; message: string };
  adminChangePassword: (newPass: string) => Promise<{ success: boolean; message: string }>;
  adminChangeCredentials: (newAdminId: string, newPass: string) => Promise<{ success: boolean;
  marketingTeam: MarketingTeamMember[];
  addMarketingMember: (name: string, phone: string, role: string) => void;
  removeMarketingMember: (id: string) => void; message: string }>;
  // UI & Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeTab: 'home' | 'vip' | 'invest' | 'bond' | 'account' | 'tx' | 'admin';
  setActiveTab: (tab: 'home' | 'vip' | 'invest' | 'bond' | 'account' | 'tx' | 'admin') => void;
  // Support chat
  chatMessages: SupportMessage[];
  sendChatMessage: (text: string) => void;
  unreadChatCount: number;
  resetUnreadChat: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MASTER_ADMIN_ID_KEY = 'rj_trust_admin_id';
const MASTER_ADMIN_PASS_KEY = 'rj_trust_admin_pw';
const STORAGE_KEY = 'rj_trust_v1_database';

// Clean initial state (no dummy/seed accounts)
const INITIAL_USERS: Record<string, User> = {};
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
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed['01700112233'];
        delete parsed['01811223344'];
        return parsed;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
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
  const [activeTab, setActiveTab] = useState<'home' | 'vip' | 'invest' | 'bond' | 'account' | 'tx' | 'admin'>('home');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Assalamu Alaikum! Welcome to RJ TRUST. How can we help your investment today? Direct WhatsApp: 01410809337',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

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
            const u = docSnap.data() as User;
            if (u && u.phone) {
              fetchedUsers[u.phone] = u;
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
  }, [users, requests, transactions, currentUserPhone, adminFeeWallet, adminFeeTransactions]);

  // Firestore background write helpers
  const persistUserToFirestore = async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.phone), user, { merge: true });
    } catch (error) {
      console.warn('Could not persist user to Firestore:', error);
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

  const currentUser = currentUserPhone ? users[currentUserPhone] || null : null;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const t = (key: keyof typeof TRANSLATIONS.bn): string => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS.bn[key] || String(key);
  };

  const login = (phone: string, pass: string) => {
    const cleanPhone = phone.trim();
    const user = users[cleanPhone];
    if (!user) {
      return { success: false, message: lang === 'bn' ? 'এই ফোন নম্বরে কোনো অ্যাকাউন্ট নেই' : 'No account found with this phone number' };
    }
    if (user.password !== pass) {
      return { success: false, message: lang === 'bn' ? 'পাসওয়ার্ড সঠিক নয়' : 'Incorrect password' };
    }
    if (user.status === 'suspended') {
      return { success: false, message: lang === 'bn' ? 'আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে' : 'Account suspended. Contact support.' };
    }
    setCurrentUserPhone(cleanPhone);
    setActiveTab('home');
    showToast(lang === 'bn' ? `স্বাগতম, ${user.fullName}!` : `Welcome back, ${user.fullName}!`, 'success');
    return { success: true, message: 'Login successful' };
  };

  const register = (fullName: string, phone: string, pass: string, referralCode?: string) => {
    const cleanPhone = phone.trim();
    const cleanName = fullName.trim();
    if (!cleanName || !cleanPhone || !pass) {
      return { success: false, message: lang === 'bn' ? 'সব প্রয়োজনীয় তথ্য পূরণ করুন' : 'Please fill all required fields' };
    }
    if (cleanPhone.length < 11) {
      return { success: false, message: lang === 'bn' ? 'সঠিক ১১ ডিজিটের ফোন নম্বর দিন' : 'Enter valid 11-digit phone number' };
    }
    if (pass.length < 6) {
      return { success: false, message: lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters' };
    }
    if (users[cleanPhone]) {
      return { success: false, message: lang === 'bn' ? 'এই ফোন নম্বরে ইতিমধ্যে অ্যাকাউন্ট রয়েছে' : 'Phone number already registered' };
    }

    let referredByPhone: string | null = null;
    if (referralCode && referralCode.trim()) {
      const cleanRef = referralCode.trim().toUpperCase();
      const parentUser = (Object.values(users) as User[]).find((u) => u.referralCode === cleanRef);
      if (parentUser) {
        referredByPhone = parentUser.phone;
        const bonusAmount = 20; // 20 BDT bonus for referring a new user
        
        // Give bonus and increment referral count
        setUsers((prev) => ({
          ...prev,
          [parentUser.phone]: {
            ...prev[parentUser.phone],
            balance: prev[parentUser.phone].balance + bonusAmount,
            commission: prev[parentUser.phone].commission + bonusAmount,
            referralCount: (prev[parentUser.phone].referralCount || 0) + 1,
          },
        }));

        // Add a transaction for the bonus
        const bonusTx = {
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
        
        // Notify referrer
        addNotification(
          parentUser.phone,
          'Referral Bonus Earned! 🎉',
          `${cleanName} joined using your code. You earned ৳${bonusAmount}!`
        );
      }
    }

    const newId = String(Math.floor(100000000 + Math.random() * 900000000));
    const newRefCode = (cleanName.slice(0, 2) + cleanPhone.slice(-4)).toUpperCase();

    const newUser: User = {
      id: newId,
      phone: cleanPhone,
      fullName: cleanName,
      password: pass,
      balance: 0,
      commission: 0,
      totalInvested: 0,
      totalWithdrawn: 0,
      activePlanIndex: -1,
      planStartDate: null,
      referralCode: newRefCode,
      referredByPhone,
      referralCount: 0,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      lastClaimDate: {},
      investments: [],
      bonds: [],
    };

    setUsers((prev) => ({
      ...prev,
      [cleanPhone]: newUser,
    }));
    persistUserToFirestore(newUser);

    setCurrentUserPhone(cleanPhone);
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

  const resetPassword = (
    phone: string,
    verificationValue: string,
    newPass: string,
    verifyType: 'id' | 'name' | 'otp' = 'id'
  ) => {
    const cleanPhone = phone.trim();
    const cleanVal = verificationValue.trim().toLowerCase();
    const user = users[cleanPhone];
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

    setUsers((prev) => ({
      ...prev,
      [cleanPhone]: {
        ...prev[cleanPhone],
        password: newPass,
      },
    }));

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
    
    if (cleanId.toLowerCase() === currentAdminId.toLowerCase() && cleanPass === currentAdminPw) {
      setIsAdminLoggedIn(true);
      setActiveTab('admin');
      showToast('Master Admin Authenticated', 'success');
      return { success: true, message: 'Admin login successful' };
    }
    
    // Hardcoded emergency fallback in case DB is totally broken or out of sync
    if (cleanId === '1020304' && cleanPass === 'admin1234') {
      setIsAdminLoggedIn(true);
      setActiveTab('admin');
      showToast('Emergency Master Admin Authenticated', 'success');
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
    setUsers((prev) => {
      const user = prev[currentUser.phone];
      const updatedBalance = user.balance - plan.investAmount;
      const updatedInvested = user.totalInvested + plan.investAmount;
      const updatedActiveIndex = Math.max(user.activePlanIndex, planIndex);

      const updatedLastClaimDate = { ...(user.lastClaimDate || {}) };
      delete updatedLastClaimDate[planIndex];
      const updatedLastClaimTimestamp = { ...(user.lastClaimTimestamp || {}) };
      delete updatedLastClaimTimestamp[planIndex];

      return {
        ...prev,
        [currentUser.phone]: {
          ...user,
          balance: updatedBalance,
          totalInvested: updatedInvested,
          activePlanIndex: updatedActiveIndex,
          planStartDate: today,
          lastClaimDate: updatedLastClaimDate,
          lastClaimTimestamp: updatedLastClaimTimestamp,
          investments: [newInvestment, ...user.investments],
        },
      };
    });

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

    // 3-Generation Referral System
    const genRates = [0.05, 0.03, 0.02]; // 5%, 3%, 2%
    const genLabels = ['1st Generation (5%)', '2nd Generation (3%)', '3rd Generation (2%)'];
    let currentReferrerPhone = currentUser.referredByPhone;

    for (let g = 0; g < 3; g++) {
      if (!currentReferrerPhone || !users[currentReferrerPhone]) break;
      const refUser = users[currentReferrerPhone];
      const refBonus = Math.floor(plan.investAmount * genRates[g]);

      if (refBonus > 0) {
        setUsers((prev) => {
          const parent = prev[refUser.phone];
          if (!parent) return prev;
          return {
            ...prev,
            [refUser.phone]: {
              ...parent,
              balance: parent.balance + refBonus,
              commission: parent.commission + refBonus,
            },
          };
        });

        const refTx: Transaction = {
          id: `tx-${Date.now()}-ref-${g}`,
          userId: refUser.phone,
          type: 'referral_commission',
          title: `Referral Commission ${genLabels[g]}: ${currentUser.fullName}`,
          titleBn: `রেফার কমিশন ${genLabels[g]}: ${currentUser.fullName}`,
          amount: refBonus,
          status: 'completed',
          date: today,
          details: `Plan: ${plan.name}`,
        };
        setTransactions((prev) => [refTx, ...prev]);
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

    setUsers((prev) => {
      const user = prev[currentUser.phone];
      return {
        ...prev,
        [currentUser.phone]: {
          ...user,
          balance: user.balance + income,
          commission: user.commission + income,
          lastClaimDate: {
            ...(user.lastClaimDate || {}),
            [planIndex]: today,
          },
          lastClaimTimestamp: {
            ...(user.lastClaimTimestamp || {}),
            [planIndex]: now,
          },
          investments: user.investments.map((inv) =>
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
        },
      };
    });

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
    if (password !== currentUser.password) return { success: false, message: lang === 'bn' ? 'ভুল পাসওয়ার্ড' : 'Incorrect password' };
    
    let receiver = users[receiverIdOrPhone];
    if (!receiver) {
      receiver = Object.values(users).find((u) => (u as User).id === receiverIdOrPhone);
    }
    if (!receiver) return { success: false, message: 'Receiver account not found' };

    const fee = amount * 0.02; // 2% fee
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

    setUsers((prev) => {
      const user = prev[currentUser.phone];
      return {
        ...prev,
        [currentUser.phone]: {
          ...user,
          balance: user.balance - bondDef.price,
          bonds: [newBond, ...(user.bonds || [])],
        },
      };
    });

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

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    showToast(
      lang === 'bn'
        ? `বন্ড ক্রয় সফল! নম্বর: ${serialNumber} (সংরক্ষণ করুন)`
        : `Bond purchased! No: ${serialNumber}`,
      'success'
    );
    return { success: true, message: 'Bond purchased', serialNumber };
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

    setUsers((prev) => ({
      ...prev,
      [u.phone]: {
        ...prev[u.phone],
        balance: prev[u.phone].balance + prizeAmount,
        commission: prev[u.phone].commission + prizeAmount,
        bonds: prev[u.phone].bonds.map((b) =>
          b.serialNumber === serialNumber
            ? { ...b, status: prizeRank as any, prizeAmount }
            : b
        ),
      },
    }));

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

    setUsers((prev) => ({
      ...prev,
      [u.phone]: {
        ...prev[u.phone],
        balance: prev[u.phone].balance + b.price,
        bonds: prev[u.phone].bonds.map((item) =>
          item.serialNumber === serialNumber ? { ...item, status: 'Return' } : item
        ),
      },
    }));

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
    if (!users[phone]) return { success: false, message: 'User not found' };

    setUsers((prev) => ({
      ...prev,
      [phone]: {
        ...prev[phone],
        balance: Math.max(0, prev[phone].balance + amount),
      },
    }));

    const adjTx: Transaction = {
      id: `tx-${Date.now()}-adj`,
      userId: phone,
      type: 'admin_adjustment',
      title: `Admin Adjustment: ${note}`,
      titleBn: `অ্যাডমিন সমন্বয়: ${note}`,
      amount,
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
    };

    setTransactions((prev) => [adjTx, ...prev]);

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

  const addMarketingMember = (name: string, phone: string, role: string) => {
    const newMember: MarketingTeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      phone,
      role,
      joinDate: new Date().toISOString()
    };
    setMarketingTeam(prev => [...prev, newMember]);
    showToast('Marketing member added successfully', 'success');
  };

  const removeMarketingMember = (id: string) => {
    setMarketingTeam(prev => prev.filter(m => m.id !== id));
    showToast('Marketing member removed', 'success');
  };

  const adminToggleUserStatus = (phone: string) => {
    const cleanPhone = phone.trim();
    const targetUser = users[cleanPhone];
    if (!targetUser) return { success: false, message: 'User not found', newStatus: '' };
    
    const newStatus = targetUser.status === 'suspended' ? 'active' : 'suspended';
    
    const updatedUser = {
      ...targetUser,
      status: newStatus
    };
    
    setUsers(prev => ({ ...prev, [cleanPhone]: updatedUser }));
    persistUserToFirestore(updatedUser);
    
    return { success: true, message: `User ${targetUser.fullName} ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`, newStatus };
  };

  const adminDeleteUser = (phone: string) => {
    const cleanPhone = phone.trim();
    const targetUser = users[cleanPhone];
    if (!targetUser) return { success: false, message: 'User not found' };
    const userName = targetUser.fullName;

    // Remove user
    setUsers((prev) => {
      const updated = { ...prev };
      delete updated[cleanPhone];
      return updated;
    });
    deleteUserFromFirestore(cleanPhone);

    // Remove user's requests
    const userReqIds = requests.filter((r) => r.userPhone === cleanPhone).map((r) => r.id);
    setRequests((prev) => prev.filter((r) => r.userPhone !== cleanPhone));
    userReqIds.forEach((reqId) => deleteRequestFromFirestore(reqId));

    // Remove user's transactions
    setTransactions((prev) => prev.filter((t) => t.userId !== cleanPhone));

    // If currently logged-in user is deleted, log out immediately
    if (currentUserPhone === cleanPhone) {
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

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    persistMessageToFirestore(userMsg);

    // Intelligent responses
    setTimeout(() => {
      const lower = text.toLowerCase();
      let botResponse = 'Thank you for your message. An RJ TRUST specialist is available on WhatsApp: 01410809337.';

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
    }, 600);
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
        approveRequest,
        rejectRequest,
        adminDeleteRequest,
        adminDeleteUser,
        adminToggleUserStatus,
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
        toast,
        showToast,
        activeTab,
        setActiveTab,
        chatMessages,
        sendChatMessage,
        unreadChatCount,
        resetUnreadChat,
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
