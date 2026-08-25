const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

if (!code.includes('const [marketingTeam, setMarketingTeam]')) {
  code = code.replace(/const \[users, setUsers\] = useState<Record<string, User>>[\\s\\S]*?\}\);/, (match) => {
    return match + `\n  const [marketingTeam, setMarketingTeam] = useState<MarketingTeamMember[]>(() => {
    const saved = localStorage.getItem('rj_marketing_team');
    return saved ? JSON.parse(saved) : [];
  });`;
  });
}

if (!code.includes('localStorage.setItem(\\'rj_marketing_team\\', JSON.stringify(marketingTeam));')) {
  code = code.replace(/useEffect\(\(\) => \{\n\s*localStorage\.setItem\('rj_users', JSON\.stringify\(users\)\);\n\s*\}, \[users\]\);/, (match) => {
    return match + `\n  useEffect(() => {\n    localStorage.setItem('rj_marketing_team', JSON.stringify(marketingTeam));\n  }, [marketingTeam]);`;
  });
}

if (!code.includes('addMarketingMember = (name: string')) {
  code = code.replace(/const adminChangeCredentials = [\\s\\S]*?catch \(error\) \{[\s\S]*?\}[\s\S]*?\};/, (match) => {
    return match + `\n\n  const addMarketingMember = (name: string, phone: string, role: string) => {\n    const newMember: MarketingTeamMember = {\n      id: Math.random().toString(36).substr(2, 9),\n      name,\n      phone,\n      role,\n      joinDate: new Date().toISOString()\n    };\n    setMarketingTeam(prev => [...prev, newMember]);\n    showToast('Marketing team member added successfully', 'success');\n  };\n\n  const removeMarketingMember = (id: string) => {\n    setMarketingTeam(prev => prev.filter(m => m.id !== id));\n    showToast('Marketing team member removed', 'success');\n  };\n`;
  });
}

// Ensure the functions are returned
if (!code.includes('addMarketingMember,')) {
  code = code.replace(/marketingTeam,/, `marketingTeam,\n      addMarketingMember,\n      removeMarketingMember,`);
}

fs.writeFileSync('src/context/AppContext.tsx', code);
