const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// 1. Add import
code = code.replace(
  "import { AdminCharts } from './AdminCharts';",
  "import { AdminCharts } from './AdminCharts';\nimport { AdminRequestsView } from './AdminRequestsView';"
);

// 2. Change state
code = code.replace(
  "useState<'analytics' | 'pending' | 'approved' | 'rejected' | 'users' | 'bonds' | 'fees' | 'audit' | 'settings'>('analytics');",
  "useState<'analytics' | 'requests' | 'users' | 'bonds' | 'fees' | 'audit' | 'settings'>('analytics');"
);

// 3. Replace the 3 top-level tab buttons with a single 'requests' button
const tabsRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveSubTab\('pending'\)\}[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setActiveSubTab\('approved'\)\}[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setActiveSubTab\('rejected'\)\}[\s\S]*?<\/button>/;

const newTabCode = `
        <button
          onClick={() => setActiveSubTab('requests')}
          className={\`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer \${
            activeSubTab === 'requests'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }\`}
        >
          <span>Requests & Approvals</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
              {pendingRequests.length}
            </span>
          )}
        </button>
`;

code = code.replace(tabsRegex, newTabCode);

// 4. Replace the content sections for pending, approved, and rejected
const contentRegex = /\{\/\* Tab: Pending Approvals \*\/\}[\s\S]*?(?=\{\/\* Tab: Users \*\/\}|\{activeSubTab === 'users')/;

const newContentCode = `
      {/* Tab: Requests (Replaces Pending, Approved, Rejected) */}
      {activeSubTab === 'requests' && (
        <AdminRequestsView
          requests={requests}
          approveRequest={approveRequest}
          rejectRequest={rejectRequest}
          adminDeleteRequest={adminDeleteRequest}
        />
      )}

      `;

if (contentRegex.test(code)) {
    code = code.replace(contentRegex, newContentCode);
} else {
    // If we can't find it with comments, let's just use string replacement for the start and end
    const startIdx = code.indexOf("{activeSubTab === 'pending' && (");
    const endIdx = code.indexOf("{activeSubTab === 'users' && (");
    if (startIdx !== -1 && endIdx !== -1) {
        code = code.substring(0, startIdx) + newContentCode + code.substring(endIdx);
    } else {
        console.log("Could not find content regex");
    }
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard patched.");
