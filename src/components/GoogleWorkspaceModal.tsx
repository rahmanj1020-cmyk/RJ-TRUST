import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  HardDrive,
  Mail,
  RefreshCw,
  Search,
  Upload,
  FolderPlus,
  Trash2,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Folder,
  Image as ImageIcon,
  FileCode,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  ArrowRight,
  Inbox,
  Clock,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
  initWorkspaceAuth,
  getWorkspaceAccessToken,
  getCachedGoogleUser,
  fetchDriveFiles,
  createDriveFolder,
  uploadTextFileToDrive,
  deleteDriveFile,
  fetchGmailMessages,
  fetchGmailMessageDetail,
  sendGmailEmail,
  deleteGmailMessage,
  DriveFileItem,
  GmailMessageSummary,
  GmailMessageDetail,
} from '../lib/googleWorkspace';
import { RJ_PLANS } from '../data/constants';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'drive' | 'gmail';
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'drive',
}) => {
  const { currentUser, transactions, showToast, lang } = useApp();

  const [activeTab, setActiveTab] = useState<'drive' | 'gmail'>(defaultTab);
  const [googleUser, setGoogleUser] = useState<any>(getCachedGoogleUser());
  const [accessToken, setAccessToken] = useState<string | null>(getWorkspaceAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Gmail state
  const [emails, setEmails] = useState<GmailMessageSummary[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailSearch, setGmailSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<GmailMessageDetail | null>(null);
  const [readingEmailLoading, setReadingEmailLoading] = useState(false);

  // Compose email modal
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Confirmation dialog state (Mandatory for destructive/sending operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    confirmStyle?: 'danger' | 'primary';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Sync default tab if passed
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Auth observer
  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Load files/emails when tab or token changes
  useEffect(() => {
    if (isOpen && accessToken) {
      if (activeTab === 'drive') {
        loadDriveFiles();
      } else {
        loadGmailMessages();
      }
    }
  }, [isOpen, activeTab, accessToken]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { user, accessToken: token } = await signInWithGoogleWorkspace();
      setGoogleUser(user);
      setAccessToken(token);
      showToast(
        lang === 'bn'
          ? `গুগল অ্যাকাউন্ট (${user.email}) সফলভাবে সংযুক্ত হয়েছে!`
          : `Connected to Google as ${user.email}!`,
        'success'
      );
    } catch (error: any) {
      showToast(error?.message || 'Google Sign-In failed or was cancelled.', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogleWorkspace();
    setGoogleUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setEmails([]);
    setSelectedEmail(null);
    showToast(lang === 'bn' ? 'গুগল অ্যাকাউন্ট বিচ্ছিন্ন করা হয়েছে।' : 'Disconnected Google account.', 'info');
  };

  // ==========================
  // GOOGLE DRIVE ACTIONS
  // ==========================
  const loadDriveFiles = async (query: string = driveSearch) => {
    if (!accessToken) return;
    setDriveLoading(true);
    try {
      const data = await fetchDriveFiles(accessToken, query);
      setDriveFiles(data.files || []);
    } catch (error: any) {
      console.error(error);
      showToast(`Drive error: ${error?.message || 'Failed to load files'}`, 'error');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleExportStatementToDrive = async () => {
    if (!accessToken || !currentUser) return;
    setIsUploading(true);

    const dateStr = new Date().toISOString().slice(0, 10);
    const activePlan = currentUser.activePlanIndex >= 0 ? RJ_PLANS[currentUser.activePlanIndex] : null;

    const statementContent = `=====================================================
RJ TRUST — TRUST • GROW • INFINITE
OFFICIAL PORTFOLIO & INVESTMENT STATEMENT
Date Generated: ${new Date().toLocaleString()}
=====================================================

INVESTOR DETAILS:
- Name: ${currentUser.fullName}
- Phone: ${currentUser.phone}
- Account ID: ${currentUser.id}
- Referral Code: ${currentUser.referralCode}
- Active VIP Plan: ${activePlan ? activePlan.name : 'No Active Plan'}

FINANCIAL BALANCE SUMMARY:
- Total Balance: ৳${currentUser.balance.toLocaleString()}
- Total Deposited: ৳${currentUser.totalDeposited.toLocaleString()}
- Total Withdrawn: ৳${currentUser.totalWithdrawn.toLocaleString()}
- Total Investment Earnings: ৳${currentUser.totalEarnings.toLocaleString()}
- Team Members Referred: ${currentUser.referralCount || 0}

ACTIVE INVESTMENTS (${currentUser.investments.length}):
${currentUser.investments
  .map(
    (inv, i) =>
      `[${i + 1}] ${inv.planName} | Principal: ৳${inv.amount.toLocaleString()} | Daily Return: ৳${inv.dailyIncome.toLocaleString()} | Days Active: ${inv.claimedDays}/${inv.totalDays} | Status: ${inv.status.toUpperCase()}`
  )
  .join('\n')}

TRANSACTION HISTORY (LATEST 20):
${transactions
  .filter((tx) => tx.userId === currentUser.phone)
  .slice(0, 20)
  .map(
    (tx) =>
      `- [${tx.timestamp}] ${tx.type.toUpperCase()} | ৳${tx.amount.toLocaleString()} | Method: ${tx.method} | Status: ${tx.status.toUpperCase()} | Ref: ${tx.id}`
  )
  .join('\n')}

=====================================================
Verified & Certified by RJ TRUST Financial Systems
Security Code: RJ-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}
=====================================================`;

    try {
      const fileName = `RJ_TRUST_Statement_${currentUser.phone}_${dateStr}.txt`;
      const uploadedFile = await uploadTextFileToDrive(
        accessToken,
        fileName,
        statementContent,
        'text/plain'
      );

      showToast(
        lang === 'bn'
          ? `স্টেটমেন্ট গুগল ড্রাইভে সেভ হয়েছে: ${fileName}`
          : `Statement uploaded to Google Drive as ${fileName}!`,
        'success'
      );
      loadDriveFiles();
    } catch (error: any) {
      showToast(`Upload failed: ${error?.message || 'Error uploading to Drive'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!accessToken || !newFolderName.trim()) return;
    try {
      await createDriveFolder(accessToken, newFolderName.trim());
      showToast(
        lang === 'bn' ? `ড্রাইভ ফোল্ডার তৈরি হয়েছে: ${newFolderName}` : `Created folder "${newFolderName}" in Drive!`,
        'success'
      );
      setNewFolderName('');
      setShowFolderModal(false);
      loadDriveFiles();
    } catch (error: any) {
      showToast(`Failed to create folder: ${error?.message}`, 'error');
    }
  };

  const promptDeleteDriveFile = (file: DriveFileItem) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === 'bn' ? 'ফাইল ডিলিট কনফার্মেশন' : 'Delete Google Drive File',
      description:
        lang === 'bn'
          ? `আপনি কি নিশ্চিতভাবে গুগল ড্রাইভ থেকে "${file.name}" ফাইলটি স্থায়ীভাবে ডিলিট করতে চান?`
          : `Are you sure you want to permanently delete "${file.name}" from your Google Drive? This action cannot be undone.`,
      confirmText: lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Delete File',
      confirmStyle: 'danger',
      onConfirm: async () => {
        if (!accessToken) return;
        try {
          await deleteDriveFile(accessToken, file.id);
          showToast(lang === 'bn' ? 'ফাইল ডিলিট করা হয়েছে।' : 'File deleted from Google Drive.', 'success');
          loadDriveFiles();
        } catch (error: any) {
          showToast(`Delete failed: ${error?.message}`, 'error');
        }
      },
    });
  };

  // ==========================
  // GMAIL ACTIONS
  // ==========================
  const loadGmailMessages = async (query: string = gmailSearch) => {
    if (!accessToken) return;
    setGmailLoading(true);
    try {
      const msgs = await fetchGmailMessages(accessToken, query);
      setEmails(msgs);
    } catch (error: any) {
      console.error(error);
      showToast(`Gmail error: ${error?.message || 'Failed to load emails'}`, 'error');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleOpenEmail = async (msg: GmailMessageSummary) => {
    if (!accessToken) return;
    setReadingEmailLoading(true);
    try {
      const detail = await fetchGmailMessageDetail(accessToken, msg.id);
      setSelectedEmail(detail);
    } catch (error: any) {
      showToast(`Could not load email body: ${error?.message}`, 'error');
    } finally {
      setReadingEmailLoading(false);
    }
  };

  const handlePrepareStatementEmail = () => {
    if (!currentUser) return;
    const activePlan = currentUser.activePlanIndex >= 0 ? RJ_PLANS[currentUser.activePlanIndex] : null;

    setComposeTo(googleUser?.email || '');
    setComposeSubject(`RJ TRUST — Investment Portfolio Report for ${currentUser.fullName}`);
    setComposeBody(`Hello ${currentUser.fullName},

Here is your requested RJ TRUST account & portfolio summary:

- Phone: ${currentUser.phone}
- Account ID: ${currentUser.id}
- VIP Tier: ${activePlan ? activePlan.name : 'Standard'}
- Current Balance: ৳${currentUser.balance.toLocaleString()}
- Total Deposited: ৳${currentUser.totalDeposited.toLocaleString()}
- Total Withdrawn: ৳${currentUser.totalWithdrawn.toLocaleString()}
- Total Earned: ৳${currentUser.totalEarnings.toLocaleString()}
- Referral Code: ${currentUser.referralCode}

Active Investment Plans:
${currentUser.investments.map((inv) => `• ${inv.planName} (৳${inv.amount.toLocaleString()}) - Daily: ৳${inv.dailyIncome.toLocaleString()}`).join('\n')}

Thank you for choosing RJ TRUST — TRUST • GROW • INFINITE!

Best regards,
RJ TRUST Automated Finance Desk`);
    setShowComposeModal(true);
  };

  const promptSendEmail = () => {
    if (!composeTo.trim()) {
      showToast('Please enter a recipient email address.', 'error');
      return;
    }
    if (!composeSubject.trim()) {
      showToast('Please enter an email subject.', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === 'bn' ? 'ইমেইল প্রেরণের অনুমতি' : 'Confirm Sending Email',
      description:
        lang === 'bn'
          ? `আপনি কি নিশ্চিতভাবে "${composeTo}" ঠিকানায় আপনার জিমেইল অ্যাকাউন্ট থেকে এই ইমেইলটি পাঠাতে চান?`
          : `Are you sure you want to send this email to "${composeTo}" with subject "${composeSubject}" from your Gmail account?`,
      confirmText: lang === 'bn' ? 'ইমেইল পাঠান' : 'Send Email Now',
      confirmStyle: 'primary',
      onConfirm: async () => {
        if (!accessToken) return;
        setIsSendingEmail(true);
        try {
          await sendGmailEmail(accessToken, composeTo, composeSubject, composeBody);
          showToast(
            lang === 'bn' ? `ইমেইল সফলভাবে পাঠানো হয়েছে: ${composeTo}` : `Email successfully sent to ${composeTo}!`,
            'success'
          );
          setShowComposeModal(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          loadGmailMessages();
        } catch (error: any) {
          showToast(`Sending failed: ${error?.message}`, 'error');
        } finally {
          setIsSendingEmail(false);
        }
      },
    });
  };

  const promptTrashEmail = (messageId: string, subject: string) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === 'bn' ? 'ইমেইল ট্র্যাশ করার অনুমতি' : 'Move Email to Trash',
      description:
        lang === 'bn'
          ? `আপনি কি নিশ্চিতভাবে "${subject || 'এই ইমেইলটি'}" ট্র্যাশে পাঠাতে চান?`
          : `Are you sure you want to move the email "${subject || '(No Subject)'}" to Trash in your Gmail?`,
      confirmText: lang === 'bn' ? 'ট্র্যাশে পাঠান' : 'Move to Trash',
      confirmStyle: 'danger',
      onConfirm: async () => {
        if (!accessToken) return;
        try {
          await deleteGmailMessage(accessToken, messageId);
          showToast(lang === 'bn' ? 'ইমেইল ট্র্যাশে পাঠানো হয়েছে।' : 'Email moved to Trash.', 'success');
          setSelectedEmail(null);
          loadGmailMessages();
        } catch (error: any) {
          showToast(`Action failed: ${error?.message}`, 'error');
        }
      },
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('folder')) return <Folder className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet') || mimeType.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (mimeType.includes('pdf') || mimeType.includes('document'))
      return <FileText className="w-5 h-5 text-red-400" />;
    return <FileCode className="w-5 h-5 text-cyan-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-[#0d1527] border-2 border-[#FCA311]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#14213D] via-[#1B2C52] to-[#0A1128] border-b border-[#2A3A5C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FCA311]/20 border border-[#FCA311]/40 flex items-center justify-center text-[#FCA311]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">Google Workspace Hub</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Drive & Gmail
                </span>
              </div>
              <p className="text-xs text-[#B0BBD4]">
                Manage cloud statements, receipts, and email communications directly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Bar */}
        <div className="p-3 sm:px-5 bg-black/50 border-b border-[#2A3A5C] flex flex-wrap items-center justify-between gap-3">
          {accessToken && googleUser ? (
            <div className="flex items-center gap-2.5">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-7 h-7 rounded-full border border-[#FCA311]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#FCA311]/20 text-[#FCA311] flex items-center justify-center font-bold text-xs">
                  {googleUser.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div className="text-xs">
                <span className="text-white font-bold">{googleUser.displayName || 'Google User'}</span>
                <span className="text-[#B0BBD4] text-[11px] ml-1.5 font-mono">({googleUser.email})</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <ShieldCheck className="w-4 h-4 text-[#FCA311]" />
              <span>Connect your Google Account to access Drive & Gmail with live permissions.</span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {accessToken && googleUser ? (
              <button
                onClick={handleGoogleSignOut}
                className="py-1 px-3 rounded-xl bg-white/10 hover:bg-red-500/20 text-xs font-bold text-gray-300 hover:text-red-400 border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="py-2 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-black text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2A3A5C] bg-[#14213D]">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-3 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'drive'
                ? 'border-[#FCA311] text-[#FCA311] bg-black/20'
                : 'border-transparent text-[#B0BBD4] hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive Files</span>
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex-1 py-3 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'gmail'
                ? 'border-[#FCA311] text-[#FCA311] bg-black/20'
                : 'border-transparent text-[#B0BBD4] hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Gmail Messages & Reports</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto min-h-[360px]">
          {!accessToken ? (
            <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FCA311]/15 text-[#FCA311] border border-[#FCA311]/30 flex items-center justify-center mx-auto shadow-xl">
                {activeTab === 'drive' ? <HardDrive className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
              </div>
              <div>
                <h4 className="text-base font-black text-white">Google Workspace Authorization Required</h4>
                <p className="text-xs text-[#B0BBD4] mt-1">
                  Connect your Google account with permission to access your Google Drive files and send or view emails via Gmail.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="py-3 px-6 rounded-2xl bg-[#FCA311] hover:bg-amber-400 text-black font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isSigningIn ? 'Connecting...' : 'Authorize Google Drive & Gmail'}</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'drive' ? (
            /* ========================================= */
            /* GOOGLE DRIVE PANEL                        */
            /* ========================================= */
            <div className="space-y-4">
              {/* Drive Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles(driveSearch)}
                    placeholder="Search files in your Google Drive..."
                    className="w-full bg-black/50 border border-[#2A3A5C] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadDriveFiles()}
                    disabled={driveLoading}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                    title="Refresh Drive Files"
                  >
                    <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={() => setShowFolderModal(true)}
                    className="py-2 px-3 rounded-xl bg-[#14213D] hover:bg-[#1B2C52] border border-[#2A3A5C] text-xs font-bold text-[#FCA311] flex items-center gap-1.5 transition-all"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>New Folder</span>
                  </button>

                  <button
                    onClick={handleExportStatementToDrive}
                    disabled={isUploading}
                    className="py-2 px-3.5 rounded-xl bg-[#FCA311] hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Save Portfolio to Drive'}</span>
                  </button>
                </div>
              </div>

              {/* Drive Files List */}
              {driveLoading ? (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-[#FCA311] animate-spin mx-auto" />
                  <p className="text-xs text-[#B0BBD4]">Loading your Google Drive files...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="py-12 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-3">
                  <HardDrive className="w-10 h-10 text-gray-500 mx-auto" />
                  <div className="text-xs text-gray-400">No files found in this query.</div>
                  <button
                    onClick={handleExportStatementToDrive}
                    className="py-2 px-4 rounded-xl bg-[#FCA311] text-black font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Export First Statement to Google Drive</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-[#FCA311]/40 flex items-center justify-between gap-3 group transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-xs text-white truncate group-hover:text-[#FCA311] transition-colors">
                            {file.name}
                          </div>
                          <div className="text-[10px] text-[#B0BBD4] flex items-center gap-2 mt-0.5 font-mono">
                            <span>
                              {file.size
                                ? `${(parseInt(file.size, 10) / 1024).toFixed(1)} KB`
                                : file.mimeType.includes('folder')
                                ? 'Folder'
                                : 'Google Doc'}
                            </span>
                            {file.modifiedTime && (
                              <span>• {new Date(file.modifiedTime).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => promptDeleteDriveFile(file)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ========================================= */
            /* GMAIL PANEL                               */
            /* ========================================= */
            <div className="space-y-4">
              {/* Gmail Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={gmailSearch}
                    onChange={(e) => setGmailSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadGmailMessages(gmailSearch)}
                    placeholder="Search emails in Gmail..."
                    className="w-full bg-black/50 border border-[#2A3A5C] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FCA311]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadGmailMessages()}
                    disabled={gmailLoading}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                    title="Refresh Gmail"
                  >
                    <RefreshCw className={`w-4 h-4 ${gmailLoading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handlePrepareStatementEmail}
                    className="py-2 px-3.5 rounded-xl bg-[#FCA311] hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Email Statement</span>
                  </button>

                  <button
                    onClick={() => {
                      setComposeTo('');
                      setComposeSubject('');
                      setComposeBody('');
                      setShowComposeModal(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-[#14213D] hover:bg-[#1B2C52] border border-[#2A3A5C] text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#FCA311]" />
                    <span>Compose</span>
                  </button>
                </div>
              </div>

              {/* Gmail List or Details View */}
              {selectedEmail ? (
                <div className="p-4 rounded-2xl bg-black/60 border border-[#2A3A5C] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-xs text-[#FCA311] font-bold flex items-center gap-1 hover:underline"
                    >
                      ← Back to Inbox
                    </button>

                    <button
                      onClick={() => promptTrashEmail(selectedEmail.id, selectedEmail.subject || '')}
                      className="py-1 px-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Move to Trash</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{selectedEmail.subject}</h3>
                    <div className="text-xs text-[#B0BBD4] mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">From: {selectedEmail.from}</span>
                      <span>• Date: {selectedEmail.date}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-3.5 rounded-xl bg-[#0A1128] border border-white/5 text-xs text-gray-200 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
                    {selectedEmail.bodyText || selectedEmail.snippet}
                  </div>
                </div>
              ) : gmailLoading ? (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-[#FCA311] animate-spin mx-auto" />
                  <p className="text-xs text-[#B0BBD4]">Loading your Gmail inbox...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="py-12 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-3">
                  <Inbox className="w-10 h-10 text-gray-500 mx-auto" />
                  <div className="text-xs text-gray-400">No emails found for this query.</div>
                  <button
                    onClick={handlePrepareStatementEmail}
                    className="py-2 px-4 rounded-xl bg-[#FCA311] text-black font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Portfolio Summary to Your Email</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {emails.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenEmail(msg)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        msg.unread
                          ? 'bg-[#14213D]/80 border-[#FCA311]/50 shadow-md'
                          : 'bg-black/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {msg.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#FCA311] shrink-0" />
                          )}
                          <span className="font-bold text-xs text-white truncate max-w-[200px] sm:max-w-sm">
                            {msg.from?.replace(/<.*>/, '').trim()}
                          </span>
                          <span className="text-[10px] text-[#B0BBD4] ml-auto shrink-0 font-mono">
                            {msg.date?.slice(0, 16)}
                          </span>
                        </div>

                        <div className="font-semibold text-xs text-amber-200 truncate">
                          {msg.subject || '(No Subject)'}
                        </div>
                        <div className="text-[11px] text-[#B0BBD4] truncate mt-0.5">
                          {msg.snippet}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            promptTrashEmail(msg.id, msg.subject || '');
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                          title="Trash email"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 px-5 bg-black/60 border-t border-[#2A3A5C] flex items-center justify-between text-[11px] text-[#B0BBD4]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2ed573]" />
            <span>Encrypted directly via Google OAuth 2.0 (Drive & Gmail)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* CREATE FOLDER SUB-MODAL */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#14213D] border border-[#FCA311] rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-[#FCA311]" />
                  <span>Create Google Drive Folder</span>
                </h4>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-xs text-[#B0BBD4] font-bold mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. RJ Trust Financial Statements"
                  className="w-full bg-black/60 border border-[#2A3A5C] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="py-2 px-4 rounded-xl bg-white/10 text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="py-2 px-4 rounded-xl bg-[#FCA311] text-black font-black text-xs disabled:opacity-50"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPOSE EMAIL SUB-MODAL */}
      <AnimatePresence>
        {showComposeModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0A1128] border-2 border-[#FCA311] rounded-3xl p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="font-black text-sm text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#FCA311]" />
                  <span>Compose Email via Gmail</span>
                </h4>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-[#B0BBD4] font-bold mb-1">To Recipient</label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-black/60 border border-[#2A3A5C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#B0BBD4] font-bold mb-1">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject line"
                  className="w-full bg-black/60 border border-[#2A3A5C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FCA311]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#B0BBD4] font-bold mb-1">Message Body</label>
                <textarea
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-black/60 border border-[#2A3A5C] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FCA311] font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] text-amber-300">
                  ⚠️ Confirmation prompt will appear before email is dispatched.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComposeModal(false)}
                    className="py-2 px-3.5 rounded-xl bg-white/10 text-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={promptSendEmail}
                    disabled={isSendingEmail || !composeTo.trim() || !composeSubject.trim()}
                    className="py-2 px-4 rounded-xl bg-[#FCA311] hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Proceed</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE / SENDING OPERATIONS */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#14213D] border-2 border-[#FCA311] rounded-3xl p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#FCA311] border border-[#FCA311]/40 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">{confirmDialog.title}</h4>
                <p className="text-xs text-[#B0BBD4] mt-2 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    await action();
                  }}
                  className={`py-2.5 px-4 rounded-xl font-black text-xs shadow-lg transition-all ${
                    confirmDialog.confirmStyle === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                      : 'bg-[#FCA311] hover:bg-amber-400 text-black shadow-amber-500/30'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
