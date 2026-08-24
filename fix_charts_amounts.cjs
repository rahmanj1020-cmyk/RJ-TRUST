const fs = require('fs');
let code = fs.readFileSync('src/components/AdminCharts.tsx', 'utf8');

// Replace totalApprovedDeposits
code = code.replace(
  '৳{totalApprovedDeposits.toLocaleString()}',
  '৳{totalApprovedDeposits === 0 ? "000" : totalApprovedDeposits.toLocaleString()}'
);

// Replace totalApprovedWithdrawals
code = code.replace(
  '৳{totalApprovedWithdrawals.toLocaleString()}',
  '৳{totalApprovedWithdrawals === 0 ? "000" : totalApprovedWithdrawals.toLocaleString()}'
);

// Replace totalInvestmentVolume
code = code.replace(
  '৳{totalInvestmentVolume.toLocaleString()}',
  '৳{totalInvestmentVolume === 0 ? "000" : totalInvestmentVolume.toLocaleString()}'
);

fs.writeFileSync('src/components/AdminCharts.tsx', code);
console.log("AdminCharts amounts formatted to 000!");
