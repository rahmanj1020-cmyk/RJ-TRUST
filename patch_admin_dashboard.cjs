const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add adminToggleUserStatus to destructuring
content = content.replace(
  "adminDeleteUser,",
  "adminDeleteUser,\n    adminToggleUserStatus,"
);

// Add suspended badge
const oldHeader = `<span className="font-black text-sm text-white">{u.fullName}</span>`;
const newHeader = `<span className="font-black text-sm text-white">{u.fullName}</span>
                      {u.status === 'suspended' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-[10px] font-extrabold text-red-400 border border-red-500/30 uppercase tracking-wider">
                          Suspended
                        </span>
                      )}`;
content = content.replace(oldHeader, newHeader);

// Add the Ban/Unban button
const toggleButton = `
                    <button
                      onClick={() => {
                        const res = adminToggleUserStatus(u.phone);
                        if (res.success) showToast(res.message, 'success');
                      }}
                      className={\`px-3 py-1.5 rounded-xl font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1 \${
                        u.status === 'suspended' 
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300' 
                          : 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300'
                      }\`}
                    >
                      <span>{u.status === 'suspended' ? 'Unban User' : 'Suspend User'}</span>
                    </button>`;

content = content.replace(
  "Adjust Balance\n                    </button>",
  "Adjust Balance\n                    </button>" + toggleButton
);

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
