const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

if (!code.includes('MarketingTeamMember')) {
  code += `
export interface MarketingTeamMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  joinDate: string;
}
`;
  fs.writeFileSync('src/types/index.ts', code);
}
