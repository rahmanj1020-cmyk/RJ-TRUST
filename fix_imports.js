import fs from 'fs';
let code = fs.readFileSync('src/components/AdminRequestsView.tsx', 'utf8');

code = code.replace(
  "import { RequestItem, MarketingTeamMember } from '../types';\nimport { User } from '../types';",
  "import { RequestItem, MarketingTeamMember, User } from '../types';"
);

fs.writeFileSync('src/components/AdminRequestsView.tsx', code);
