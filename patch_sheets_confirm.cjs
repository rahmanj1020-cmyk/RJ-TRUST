const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleSheetsExport.tsx', 'utf8');

code = code.replace(
  "const exportData = async () => {\n    try {\n      setIsExporting(true);",
  "const exportData = async () => {\n    const confirmed = window.confirm('Are you sure you want to export all Audit Logs and User data to a new Google Spreadsheet?');\n    if (!confirmed) return;\n\n    try {\n      setIsExporting(true);"
);

fs.writeFileSync('src/components/GoogleSheetsExport.tsx', code);
console.log("Patched GoogleSheetsExport to include confirmation.");
