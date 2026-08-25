const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{/* Add Marketing Team Member Modal */}');
const beforeEnd = code.lastIndexOf('  </div>\n  );\n};');

if (startIndex !== -1 && beforeEnd !== -1) {
  const modalCode = code.substring(startIndex, beforeEnd);
  // Remove it from the end of the file
  code = code.substring(0, startIndex) + code.substring(beforeEnd);
  
  const endMatch = code.match(/    <\/div>\s*\);\s*\};\s*const AdminFeeDashboard/);
  if (endMatch) {
    code = code.replace(endMatch[0], modalCode + '\n' + endMatch[0]);
    fs.writeFileSync('src/components/AdminDashboard.tsx', code);
    console.log('Fixed using regex!');
  } else {
    console.log('Regex still failed to match');
  }
}
