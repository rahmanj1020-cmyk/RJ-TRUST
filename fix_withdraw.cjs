const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const targetStr = `    // Security: Verify Admin Password before withdrawal
    const storedPass = localStorage.getItem(MASTER_ADMIN_PASS_KEY);
    if (password !== storedPass && password !== 'admin1234') {
      return { success: false, message: 'Incorrect Admin Password/PIN' };
    }`;

const newStr = `    // Security: Verify Admin Password before withdrawal
    if (password !== adminPw) {
      return { success: false, message: 'Incorrect Admin Password/PIN' };
    }`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/context/AppContext.tsx', code);
console.log("adminWithdrawFee fixed");
