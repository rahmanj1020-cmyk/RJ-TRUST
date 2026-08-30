import fs from 'fs';
const content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const replacement = `
        const mergedUsers = { ...baseUsers, ...uniqueParsed };
        const idSet = new Set();
        const finalUsers: Record<string, User> = {};
        Object.values(mergedUsers).forEach((u: any) => {
          if (!idSet.has(u.id)) {
            idSet.add(u.id);
            finalUsers[u.phone] = u;
          } else {
            const newId = String(Math.floor(100000000 + Math.random() * 900000000));
            u.id = newId;
            idSet.add(newId);
            finalUsers[u.phone] = u;
          }
        });
        return finalUsers;
`;

const newContent = content.replace('return { ...baseUsers, ...uniqueParsed };', replacement);
fs.writeFileSync('src/context/AppContext.tsx', newContent);
