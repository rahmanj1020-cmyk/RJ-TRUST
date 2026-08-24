const fs = require('fs');
let content = fs.readFileSync('src/components/TransferModal.tsx', 'utf8');

content = content.replace(
  "Receiver Phone Number",
  "Receiver Account ID / Phone Number"
);
content = content.replace(
  "placeholder=\"e.g. 017XXXXXXXX\"",
  "placeholder=\"e.g. 017XXXXXX or 9-digit ID\""
);

fs.writeFileSync('src/components/TransferModal.tsx', content);
