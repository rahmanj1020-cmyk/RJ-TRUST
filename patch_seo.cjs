const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const newMeta = `    <title>RJ TRUST — TRUST • GROW • INFINITE</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="RJ TRUST — TRUST • GROW • INFINITE" />
    <meta name="description" content="RJ TRUST is a premium wealth management platform offering high-yield VIP investment plans, secure price bonds, and lucrative 3-generation referral bonuses. Start growing your infinite wealth today!" />
    <meta name="keywords" content="RJ Trust, investment platform, VIP investment plans, premium wealth management, make money online, price bonds Bangladesh, online earning BD, referral bonus, passive income" />
    <meta name="author" content="RJ TRUST" />
    <meta name="robots" content="index, follow" />
    <meta name="language" content="Bengali, English" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="RJ TRUST — TRUST • GROW • INFINITE" />
    <meta property="og:description" content="RJ TRUST is a premium wealth management platform offering high-yield VIP investment plans, secure price bonds, and lucrative 3-generation referral bonuses." />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="RJ TRUST — TRUST • GROW • INFINITE" />
    <meta property="twitter:description" content="RJ TRUST is a premium wealth management platform offering high-yield VIP investment plans, secure price bonds, and lucrative 3-generation referral bonuses." />`;

content = content.replace(
  /<title>RJ TRUST — TRUST • GROW • INFINITE<\/title>\s*<meta name="description" content="[^"]+" \/>/,
  newMeta
);

fs.writeFileSync('index.html', content);
