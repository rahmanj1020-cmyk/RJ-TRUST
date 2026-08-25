const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{/* Add Marketing Team Member Modal */}');
const beforeEnd = code.lastIndexOf('  </div>\n  );\n};');

if (startIndex !== -1 && beforeEnd !== -1) {
  const modalCode = code.substring(startIndex, beforeEnd);
  // Remove it from the end of the file
  code = code.substring(0, startIndex) + code.substring(beforeEnd);
  
  // Now find the end of AdminDashboard
  const adminDashboardEndIndex = code.indexOf('    </div>\n  );\n};\n\nconst AdminFeeDashboard');
  
  if (adminDashboardEndIndex !== -1) {
     code = code.substring(0, adminDashboardEndIndex) + 
            modalCode + '\n' +
            code.substring(adminDashboardEndIndex);
            
     fs.writeFileSync('src/components/AdminDashboard.tsx', code);
     console.log('Successfully moved modal to AdminDashboard');
  } else {
     // fallback
     const adminEndMatch = code.indexOf('  );\n};\n\nconst AdminFeeDashboard');
     if (adminEndMatch !== -1) {
       // We need to insert before the last </div> which is before adminEndMatch
       const exactEnd = code.lastIndexOf('    </div>', adminEndMatch);
       if (exactEnd !== -1) {
         code = code.substring(0, exactEnd) + 
                modalCode + '\n' +
                code.substring(exactEnd);
         fs.writeFileSync('src/components/AdminDashboard.tsx', code);
         console.log('Successfully moved modal via fallback');
       }
     } else {
       console.log('Could not find AdminDashboard end');
     }
  }
}
