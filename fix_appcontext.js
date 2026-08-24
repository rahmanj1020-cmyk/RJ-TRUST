const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Replace the messed up block starting from `if (!cleanVal || cleanVal.length <   const adminLogin = `
// down to the end of the adminLogin function.

const startRegex = /    } else if \(verifyType === 'otp'\) \{\n      if \(!cleanVal \|\| cleanVal\.length <   const adminLogin[\s\S]*?message: lang === 'bn' \? 'ভুল অ্যাডমিন আইডি বা পাসওয়ার্ড' : 'Invalid Admin ID বা পাসওয়ার্ড',\s*\}\s*;/;

// No, let's just use string slicing based on exact search.

const startIndex = code.indexOf(`    } else if (verifyType === 'otp') {`);
const endIndex = code.indexOf(`  const adminLogout = () => {`);

if (startIndex !== -1 && endIndex !== -1) {
  const goodCode = `    } else if (verifyType === 'otp') {
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

  const adminLogin = (idInput: string, passwordInput: string) => {
    const cleanId = (idInput || '').trim();
    const cleanPass = passwordInput || '';
    
    if (cleanId.toLowerCase() === adminId.toLowerCase() && cleanPass === adminPw) {
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

`;
  
  code = code.substring(0, startIndex) + goodCode + code.substring(endIndex);
  fs.writeFileSync('src/context/AppContext.tsx', code);
  console.log("Fixed successfully!");
} else {
  console.log("Could not find start or end index.");
}

