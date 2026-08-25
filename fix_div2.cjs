const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const lastPart = '      </div>\n        </div>\n  );\n};';
code = code.replace(lastPart, '      </div>\n    </div>\n  </div>\n  );\n};\n');
fs.writeFileSync('src/components/AdminDashboard.tsx', code);
