import fs from 'fs';

let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

if (!code.includes('MarketingTeamMember')) {
  code = code.replace(/import \{([^}]+)\} from '\.\.\/types';/, (match, p1) => {
    return `import {${p1}, MarketingTeamMember} from '../types';`;
  });
}

if (!code.includes('marketingTeam: MarketingTeamMember[];')) {
  code = code.replace(/adminChangeCredentials:[^;]+;/, `$&
  marketingTeam: MarketingTeamMember[];
  addMarketingMember: (name: string, phone: string, role: string) => void;
  removeMarketingMember: (id: string) => void;`);
}

if (!code.includes('const [marketingTeam, setMarketingTeam]')) {
  code = code.replace(/const \[users, setUsers\] = useState<Record<string, User>>\(\(\) => \{/, 
  `const [marketingTeam, setMarketingTeam] = useState<MarketingTeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('rj_marketing_team');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  $&`);
}

if (!code.includes('rj_marketing_team\', JSON.stringify(marketingTeam)')) {
  code = code.replace(/localStorage\.setItem\(STORAGE_KEY \+ '_users', JSON\.stringify\(users\)\);/, 
  `$&
      localStorage.setItem('rj_marketing_team', JSON.stringify(marketingTeam));`);
}

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
    showToast('Marketing team member added successfully');
  };

  const removeMarketingMember = (id: string) => {
    setMarketingTeam(prev => prev.filter(m => m.id !== id));
    showToast('Marketing team member removed');
  };
`);
}

if (!code.includes('addMarketingMember,')) {
  code = code.replace(/adminChangeCredentials,\n/s, `$&      marketingTeam,
      addMarketingMember,
      removeMarketingMember,
`);
}

fs.writeFileSync('src/context/AppContext.tsx', code);
