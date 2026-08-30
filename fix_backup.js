import fs from 'fs';
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
code = code.replace(/const backupData = \{\n      users,\n      transactions,\n      requests,\n      marketingTeam,\n      auditLogs,\n      adminFeeWallets\n    \};/g, 
`const backupData = {
      users,
      transactions,
      requests,
      adminFeeWallet,
      adminFeeTransactions
    };`);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
