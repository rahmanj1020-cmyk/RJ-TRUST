const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const lastParen = code.lastIndexOf('  );');
if (lastParen !== -1) {
  code = code.substring(0, lastParen) + '      </div>\n' + code.substring(lastParen);
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
}
