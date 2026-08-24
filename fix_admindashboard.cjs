const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const targetStr = `const [newAdminIdState, setNewAdminIdState] = useState(adminId || 'admin');`;
const newStr = `const [newAdminIdState, setNewAdminIdState] = useState(adminId || 'admin');
  
  React.useEffect(() => {
    setNewAdminIdState(adminId || 'admin');
  }, [adminId]);`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard fixed");
