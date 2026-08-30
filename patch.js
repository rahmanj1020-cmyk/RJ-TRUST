import fs from 'fs';
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const backupFunc = `
  const handleBackupDatabase = () => {
    const backupData = {
      users,
      transactions,
      requests,
      marketingTeam,
      auditLogs,
      adminFeeWallets
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", \`database_backup_\${new Date().toISOString().split('T')[0]}.json\`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCredentialsSubmit`;

code = code.replace('const handleCredentialsSubmit', backupFunc);

const backupBtn = `
            <button
              onClick={handleBackupDatabase}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup Database</span>
            </button>
            <button
              onClick={() => syncAllDataFromFirestore()}
`;

code = code.replace('<button\n              onClick={() => syncAllDataFromFirestore()}', backupBtn);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
