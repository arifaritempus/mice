const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

code = code.replace(/setAppliedSearchInput\(''\);/g, "setSearchTokens([]);");

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS 5');
