import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, getAccessToken, googleLogout } from '../lib/googleAuth';
import { FileSpreadsheet, LogIn, LogOut, Check, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GoogleSheetsExport: React.FC = () => {
  const { transactions, users, showToast } = useApp();
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
      showToast('Google Sign-In failed', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setUser(null);
    setNeedsAuth(true);
  };

  const exportData = async () => {
    const confirmed = window.confirm('Are you sure you want to export all Audit Logs and User data to a new Google Spreadsheet?');
    if (!confirmed) return;

    try {
      setIsExporting(true);
      const token = await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        throw new Error('No access token available');
      }

      // Create a new spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `RJ TRUST Admin Export - ${new Date().toISOString().split('T')[0]}`,
          },
          sheets: [
            { properties: { title: 'Audit Log' } },
            { properties: { title: 'Users' } }
          ]
        })
      });
      
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error?.message || 'Failed to create spreadsheet');
      
      const spreadsheetId = createData.spreadsheetId;

      // Prepare data
      const auditLogs = transactions
        .filter(tx => 
          tx.type === 'admin_adjustment' || 
          (tx.type === 'deposit' && tx.status === 'approved') ||
          (tx.type === 'withdrawal' && tx.status === 'completed')
        )
        .sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));

      const auditSheetData = [
        ['ID', 'Type', 'User ID', 'Amount', 'Date', 'Title'],
        ...auditLogs.map(log => [
          log.id,
          log.type,
          log.userId,
          log.amount,
          new Date(log.timestamp || log.date).toLocaleString(),
          log.title
        ])
      ];

      const userArray = Object.values(users) as any[];
      const userSheetData = [
        ['Phone/ID', 'Name', 'Balance', 'Total Invested', 'Total Withdrawn', 'Joined'],
        ...userArray.map(u => [
          u.phone,
          u.fullName,
          u.balance,
          u.totalInvested || 0,
          u.totalWithdrawn || 0,
          u.joinedAt || ''
        ])
      ];

      // Update data
      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: "'Audit Log'!A1",
              values: auditSheetData
            },
            {
              range: "'Users'!A1",
              values: userSheetData
            }
          ]
        })
      });

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.error?.message || 'Failed to update spreadsheet');
      }

      showToast('Data exported successfully!', 'success');
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
      
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Google Workspace Integration</h3>
          <p className="text-xs text-[#B0BBD4]">Export platform data to Google Sheets</p>
        </div>
      </div>

      {needsAuth || !user ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#B0BBD4] mb-6">
            Connect your Google Workspace account to enable one-click data exports to Google Sheets.
          </p>
          
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70 mx-auto"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-[#05070a] border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user.email}</p>
                <p className="text-[10px] text-[#B0BBD4]">Connected to Google Workspace</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={exportData}
            disabled={isExporting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isExporting ? 'Creating Spreadsheet...' : 'Export Audit Log & Users to Google Sheets'}
          </button>
        </div>
      )}
    </div>
  );
};
