const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const toRemove = `  const addMarketingMember = (name: string, phone: string, role: string) => {
    const newMember: MarketingTeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      phone,
      role,
      joinDate: new Date().toISOString()
    };
    setMarketingTeam(prev => [...prev, newMember]);
    showToast('Marketing member added successfully');
  };

  const removeMarketingMember = (id: string) => {
    setMarketingTeam(prev => prev.filter(m => m.id !== id));
    showToast('Marketing member removed');
  };`;

// Remove the wrongly placed block
code = code.replace(toRemove, '');

// Now we need to place it OUTSIDE adminChangeCredentials
// find where adminChangeCredentials ends (line 1692)
code = code.replace(/  const adminChangePassword = \(newPass: string\) => \{/, \`\${toRemove}

  const adminChangePassword = (newPass: string) => {\`);

fs.writeFileSync('src/context/AppContext.tsx', code);
