const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const modalCode = `
      {/* Add Marketing Team Member Modal */}
      {showAddMarketing && (
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
`;

code = code.replace(/    <\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};\s*$/s, `    </div>\n      </div>\n${modalCode}\n    </div>\n  );\n};`);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
