const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

content = content.replace(
  "const handleCredentialsSubmit = (e: React.FormEvent) => {",
  "const handleCredentialsSubmit = async (e: React.FormEvent) => {"
);
content = content.replace(
  "const res = adminChangeCredentials(newAdminIdState, newAdminPass);",
  "const res = await adminChangeCredentials(newAdminIdState, newAdminPass);"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
