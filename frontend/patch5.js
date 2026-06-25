const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

pageContent = pageContent.replace(
  /return \{\n\s*totalRev,/,
  `return {\n      totalRev,\n      miceRev,\n      sejRev,`
);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Fixed return fields");
