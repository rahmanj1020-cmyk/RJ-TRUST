const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /<p className="text-xs text-\[#B0BBD4\]">Full Management, Approvals, Lottery & Ledgers<\/p>\s*<\/div>\s*<\/div>\s*<button\s*onClick=\{\(\) => setActiveSubTab\('requests'\)\}/;

const fixedStr = `<p className="text-xs text-[#B0BBD4]">Full Management, Approvals, Lottery & Ledgers</p>
          </div>
        </div>
        <button
          onClick={adminLogout}
          className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          title="Exit Admin Panel"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={\`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer \${
            activeSubTab === 'analytics'
              ? 'bg-[#FCA311] text-black shadow-lg shadow-amber-500/20'
              : 'bg-[#14213D] text-[#B0BBD4] border border-[#2A3A5C] hover:text-white'
          }\`}
        >
          <LineChart className="w-4 h-4" />
          <span>Financial & Growth Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}`;

code = code.replace(regex, fixedStr);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("Patched fixed!");
