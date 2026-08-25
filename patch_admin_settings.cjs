const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Import the component
code = code.replace(
  "import { AdminRequestsView } from './AdminRequestsView';",
  "import { AdminRequestsView } from './AdminRequestsView';\nimport { GoogleSheetsExport } from './GoogleSheetsExport';"
);

// Find the Settings tab block and prepend the Export component before the existing settings block
const settingsRegex = /\{activeSubTab === 'settings' && \([\s\S]*?<>[\s\S]*?<div className="bg-\[#14213D\] border border-\[#2A3A5C\] rounded-3xl p-6 shadow-2xl max-w-md mx-auto">/;

const newSettingsCode = `{activeSubTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6 max-w-md mx-auto"
        >
          <GoogleSheetsExport />

          <div className="bg-[#14213D] border border-[#2A3A5C] rounded-3xl p-6 shadow-2xl">`;

if (settingsRegex.test(code)) {
    code = code.replace(settingsRegex, newSettingsCode);
    
    // Also we need to close the motion.div at the end of the settings block
    // Search for the end of activeSubTab === 'settings' block.
    // Since we replaced the `<>` with `<motion.div className="space-y-6 max-w-md mx-auto">`, the end of the settings block which was `</>` now needs to be `</motion.div>`
    // The previous code had:
    // {activeSubTab === 'settings' && (
    //  <>
    //    <div ...>
    //    ...
    //    </div>
    //  </>
    // )}
    code = code.replace(/<\/>\n\s*\)}/g, "</motion.div>\n        )}");
}

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard patched for Google Sheets Export.");
