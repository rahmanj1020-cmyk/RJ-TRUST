const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Replace totalDeposits
code = code.replace(
  '৳{totalDeposits.toLocaleString()}',
  '৳{totalDeposits === 0 ? "000" : totalDeposits.toLocaleString()}'
);

// Replace totalWithdrawals
code = code.replace(
  '৳{totalWithdrawals.toLocaleString()}',
  '৳{totalWithdrawals === 0 ? "000" : totalWithdrawals.toLocaleString()}'
);

// Replace adminFeeWallet feeBalance
code = code.replace(
  '৳{adminFeeWallet?.feeBalance?.toLocaleString() || 0}',
  '৳{(!adminFeeWallet?.feeBalance || adminFeeWallet.feeBalance === 0) ? "000" : adminFeeWallet.feeBalance.toLocaleString()}'
);

// Replace adminFeeWallet totalCollected
code = code.replace(
  '৳{adminFeeWallet?.totalCollected?.toLocaleString() || 0}',
  '৳{(!adminFeeWallet?.totalCollected || adminFeeWallet.totalCollected === 0) ? "000" : adminFeeWallet.totalCollected.toLocaleString()}'
);

// Replace adminFeeWallet totalWithdrawn
code = code.replace(
  '৳{adminFeeWallet?.totalWithdrawn?.toLocaleString() || 0}',
  '৳{(!adminFeeWallet?.totalWithdrawn || adminFeeWallet.totalWithdrawn === 0) ? "000" : adminFeeWallet.totalWithdrawn.toLocaleString()}'
);

// Replace pendingFees
code = code.replace(
  '৳{pendingFees.toLocaleString()}',
  '৳{pendingFees === 0 ? "000" : pendingFees.toLocaleString()}'
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Amounts formatted to 000!");
