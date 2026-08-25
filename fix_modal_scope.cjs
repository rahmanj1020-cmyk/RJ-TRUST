const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{/* Add Marketing Team Member Modal */}');
if (startIndex !== -1) {
  const endIndex = code.lastIndexOf(')}');
  // Wait, let's find the closing brace exactly
  const beforeEnd = code.lastIndexOf('  </div>\n  );\n};');
  if (beforeEnd !== -1) {
    const modalCode = code.substring(startIndex, beforeEnd - 10);
    // Let's print out what we found
    console.log("Found modal length:", modalCode.length);
    code = code.replace(modalCode, '');
    
    // Now insert it at the end of AdminDashboard component
    // We can search for the end of AdminDashboard
    const adminDashboardEndIndex = code.indexOf('        </motion.div>\n        )}\n      </div>\n    </div>\n  );\n};');
    
    if (adminDashboardEndIndex !== -1) {
       console.log('Found AdminDashboard end');
       code = code.substring(0, adminDashboardEndIndex) + 
              '        </motion.div>\n        )}\n' + 
              modalCode + '\n' +
              '      </div>\n    </div>\n  );\n};' + 
              code.substring(adminDashboardEndIndex + '        </motion.div>\n        )}\n      </div>\n    </div>\n  );\n};'.length);
              
       fs.writeFileSync('src/components/AdminDashboard.tsx', code);
       console.log('Fixed');
    } else {
       // Find end using regex
       const adminEndMatch = code.match(/      <\/div>\n    <\/div>\n  \);\n\};/);
       if (adminEndMatch) {
         code = code.replace(adminEndMatch[0], modalCode + '\n' + adminEndMatch[0]);
         fs.writeFileSync('src/components/AdminDashboard.tsx', code);
         console.log('Fixed via regex fallback');
       } else {
         console.log('Could not find end of AdminDashboard');
       }
    }
  }
} else {
  console.log('Modal not found');
}
