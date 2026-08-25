const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Add MarketingTeamMember to import
if (!code.includes('MarketingTeamMember')) {
  code = code.replace(/import \{([^}]+)\} from '\.\.\/types';/, (match, p1) => {
    return `import {${p1}, MarketingTeamMember} from '../types';`;
  });
}

// Add to AppContextType
if (!code.includes('marketingTeam: MarketingTeamMember[]')) {
  code = code.replace(/adminChangeCredentials:[^;]+;/, `$&
  marketingTeam: MarketingTeamMember[];
  addMarketingMember: (name: string, phone: string, role: string) => void;
  removeMarketingMember: (id: string) => void;`);
}

// Add state to AppProvider
if (!code.includes('const [marketingTeam, setMarketingTeam]')) {
  code = code.replace(/const \[users, setUsers\] = useLocalStorage[^\n]+\n/, `$&  const [marketingTeam, setMarketingTeam] = useLocalStorage<MarketingTeamMember[]>('rj_marketing_team', []);\n`);
}

// Add functions to AppProvider
if (!code.includes('addMarketingMember = (name: string')) {
  code = code.replace(/const adminChangeCredentials =[^}]+};/s, `$&

  const addMarketingMember = (name: string, phone: string, role: string) => {
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
  };
`);
}

// Add to return values
if (!code.includes('marketingTeam,')) {
  code = code.replace(/adminChangeCredentials,\n/s, `$&      marketingTeam,
      addMarketingMember,
      removeMarketingMember,
`);
}

fs.writeFileSync('src/context/AppContext.tsx', code);
