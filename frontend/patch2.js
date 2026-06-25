const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Fix Tooltip money detection
pageContent = pageContent.replace(
  /"Kâr",\n\s*"Maliyet",\n\s*"Satis",/m,
  `"Kâr",\n              "Maliyet",\n              "Satis",\n              "Satış",\n              "Kar/Zarar",`
);

// 2. Change Agency YAxis formatter 3800k -> 3.8M
pageContent = pageContent.replace(
  /tickFormatter=\{\(v\) => \`\$\{\(v \/ 1000\)\.toFixed\(0\)\}k\`\}/g,
  `tickFormatter={(v) => \`\${(v / 1000000).toFixed(1)}M\`}`
);

// 3. Remove HR Chart completely
// It is wrapped in a GlassCard with a title "İnsan Kaynakları" or something.
// Wait, I will use regex to find and remove the whole HR block.
// Let's first read the file to see the exact HR block.
fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Patched tooltips and formatting.");
