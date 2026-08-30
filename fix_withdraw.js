import fs from 'fs';
let code = fs.readFileSync('src/components/WithdrawModal.tsx', 'utf8');

code = code.replace(
  /\{\/\* hidden original button to replace \*\/\}[\s\S]*?(?=<\/form>)/,
  ""
);

fs.writeFileSync('src/components/WithdrawModal.tsx', code);
