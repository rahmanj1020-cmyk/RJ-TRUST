import fs from 'fs';

let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('marketingTeam')) {
  code = code.replace(/sendGlobalNotification,\s*lang,\s*\} = useApp\(\);/, 
  `$&
  const { marketingTeam, addMarketingMember, removeMarketingMember } = useApp();`);
}

if (!code.includes('marketingTeamName')) {
  code = code.replace(/const \[adjustNote, setAdjustNote\] = useState<string>\('Bonus \/ Correction'\);/, 
  `$&
  // Marketing Team modal state
  const [marketingTeamName, setMarketingTeamName] = useState('');
  const [marketingTeamPhone, setMarketingTeamPhone] = useState('');
  const [marketingTeamRole, setMarketingTeamRole] = useState('');
  const [showAddMarketing, setShowAddMarketing] = useState(false);`);
}

if (!code.includes('\\'marketing\\'')) {
  code = code.replace(/useState<'analytics' \| 'requests' \| 'users' \| 'bonds' \| 'fees' \| 'audit' \| 'settings'>/, 
  `useState<'analytics' | 'requests' | 'users' | 'bonds' | 'fees' | 'audit' | 'marketing' | 'settings'>`);
}

if (!code.includes('setActiveSubTab(\\'marketing\\')')) {
  code = code.replace(/<button\s*onClick=\{[^}]*setActiveSubTab\('settings'\)\}[^>]*>\s*<KeyRound className="w-4 h-4" \/>\s*<span>Settings & Credentials<\/span>\s*<\/button>/,
  `<button
          onClick={() => setActiveSubTab('marketing')}
          className={\`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer \${
            activeSubTab === 'marketing'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }\`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Marketing Team</span>
        </button>
        
        $&`);
}

if (!code.includes('activeSubTab === \\'marketing\\'')) {
  code = code.replace(/\{activeSubTab === 'settings' && \(/,
  `{activeSubTab === 'marketing' && (
        <div className="space-y-6">
          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FCA311]" />
                  RJ Trust Marketing Team
                </h3>
                <p className="text-xs text-[#B0BBD4] mt-1">Manage marketing team members and their roles</p>
              </div>
              <button
                onClick={() => setShowAddMarketing(true)}
                className="bg-[#FCA311] text-black px-4 py-2 rounded-xl text-xs font-black hover:bg-amber-400 transition-colors cursor-pointer"
              >
                + Add Member
              </button>
            </div>

            <div className="space-y-3">
              {marketingTeam.length === 0 ? (
                <div className="text-center py-10 text-[#B0BBD4] text-sm bg-black/20 rounded-xl">
                  No marketing team members added yet.
                </div>
              ) : (
                marketingTeam.map((member) => (
                  <div key={member.id} className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-white font-black">{member.name}</div>
                      <div className="text-xs text-[#B0BBD4] mt-1">
                        Phone: <span className="text-emerald-400 font-medium">{member.phone}</span> • Role: <span className="text-amber-400">{member.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this team member?')) {
                          removeMarketingMember(member.id);
                        }
                      }}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      $&`);
}

if (!code.includes('Add Marketing Team Member')) {
  code = code.replace(/<\/AnimatePresence>\s*<\/div>\s*\);\s*\};\s*export default AdminDashboard;/s,
  `  {showAddMarketing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#14213D] w-full max-w-md rounded-3xl overflow-hidden border border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="font-black text-white text-lg">Add Marketing Member</h3>
                <button
                  onClick={() => setShowAddMarketing(false)}
                  className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#B0BBD4] mb-1.5 ml-1">Name</label>
                  <input
                    type="text"
                    value={marketingTeamName}
                    onChange={(e) => setMarketingTeamName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FCA311] transition-colors"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B0BBD4] mb-1.5 ml-1">Phone Number</label>
                  <input
                    type="text"
                    value={marketingTeamPhone}
                    onChange={(e) => setMarketingTeamPhone(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FCA311] transition-colors"
                    placeholder="e.g. 017..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B0BBD4] mb-1.5 ml-1">Role / Designation</label>
                  <input
                    type="text"
                    value={marketingTeamRole}
                    onChange={(e) => setMarketingTeamRole(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FCA311] transition-colors"
                    placeholder="e.g. Lead Marketer"
                  />
                </div>
                
                <button
                  onClick={() => {
                    if (!marketingTeamName || !marketingTeamPhone || !marketingTeamRole) {
                      alert('Please fill all fields');
                      return;
                    }
                    addMarketingMember(marketingTeamName, marketingTeamPhone, marketingTeamRole);
                    setMarketingTeamName('');
                    setMarketingTeamPhone('');
                    setMarketingTeamRole('');
                    setShowAddMarketing(false);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FCA311] to-[#E59400] text-black rounded-xl font-black text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  Add Team Member
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
$&`);
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
