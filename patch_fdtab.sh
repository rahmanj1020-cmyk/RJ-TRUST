#!/bin/bash
sed -i "/activeSegment === 'history'/s/'history'/'fds'/" src/components/FDTab.tsx
sed -i "s/setActiveSegment('history')/setActiveSegment('fds')/g" src/components/FDTab.tsx

sed -i "/{lang === 'bn' ? 'আমার এফডি সমূহ' : 'My FDs'}/a \        </button>\n        <button\n          onClick={() => setActiveSegment('tx')}\n          className={\`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all \${\n            activeSegment === 'tx'\n              ? 'bg-[#FCA311] text-black shadow-lg shadow-[#FCA311]/20'\n              : 'text-[#B0BBD4] hover:text-white'\n          }\`}\n        >\n          {lang === 'bn' ? 'লেনদেন' : 'History'}" src/components/FDTab.tsx
