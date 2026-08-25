const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/      <\/div>\n        <\/div>\n  \);\n\};$/, '      </div>\n    </div>\n  </div>\n  );\n};\n\nexport default AdminDashboard;');
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
