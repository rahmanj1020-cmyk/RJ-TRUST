const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(/    <\/div>\s*};\s*$/s, `    </div>\n    </div>\n    </div>\n  );\n};\n`);
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
