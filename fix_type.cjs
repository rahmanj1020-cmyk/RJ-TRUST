const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace(
  "adminChangeCredentials: (newAdminId: string, newPass: string) => { success: boolean; message: string };",
  "adminChangeCredentials: (newAdminId: string, newPass: string) => Promise<{ success: boolean; message: string }>;"
);
content = content.replace(
  "adminChangePassword: (newPass: string) => { success: boolean; message: string };",
  "adminChangePassword: (newPass: string) => Promise<{ success: boolean; message: string }>;"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
