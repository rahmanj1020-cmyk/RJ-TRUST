const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Replace the collection name
content = content.replace(/doc\(db, 'adminSettings', 'credentials'\)/g, "doc(db, 'settings', 'adminCredentials')");

fs.writeFileSync('src/context/AppContext.tsx', content);
