const fs = require('fs');
let content = fs.readFileSync('src/components/TransferModal.tsx', 'utf8');

content = content.replace(
  "const [amount, setAmount] = useState('');",
  "const [amount, setAmount] = useState('');\n  const [password, setPassword] = useState('');"
);

content = content.replace(
  "const res = transferFunds(receiver, numAmount);",
  "const res = transferFunds(receiver, numAmount, password);"
);

content = content.replace(
  "setAmount('');",
  "setAmount('');\n      setPassword('');"
);

const passwordField = `
            <div>
              <label className="block text-[11px] font-bold text-[#B0BBD4] mb-1.5 uppercase tracking-wider">Account Password / PIN</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#14213D] border border-[#2A3A5C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FCA311]"
                required
              />
            </div>`;

content = content.replace(
  "required\n              />\n            </div>\n            <button",
  "required\n              />\n            </div>" + passwordField + "\n            <button"
);

fs.writeFileSync('src/components/TransferModal.tsx', content);
