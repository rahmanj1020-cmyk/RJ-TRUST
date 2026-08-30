import fs from 'fs';
let code = fs.readFileSync('src/components/AdminRequestsView.tsx', 'utf8');

code = code.replace(
  "interface Props {\n  requests: RequestItem[];\n  marketingTeam: MarketingTeamMember[];",
  "import { User } from '../types';\ninterface Props {\n  requests: RequestItem[];\n  marketingTeam: MarketingTeamMember[];\n  users: Record<string, User>;"
);

code = code.replace(
  "export const AdminRequestsView: React.FC<Props> = ({ requests, marketingTeam, approveRequest, rejectRequest, adminDeleteRequest }) => {",
  "export const AdminRequestsView: React.FC<Props> = ({ requests, marketingTeam, users, approveRequest, rejectRequest, adminDeleteRequest }) => {"
);

code = code.replace(
  "const isMarketingMember = marketingTeam.some(m => m.phone === req.userPhone);",
  "const isMarketingMember = users[req.userPhone]?.isMarketingTeam || marketingTeam.some(m => m.phone === req.userPhone);"
);

fs.writeFileSync('src/components/AdminRequestsView.tsx', code);
