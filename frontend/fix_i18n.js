const fs = require('fs');
let code = fs.readFileSync('src/lib/i18n.ts', 'utf8');

code = code.replace(/'projects\.quotePackage': 'PAKET',/g, "'projects.quotePackage': 'PAKET',\n    'projects.quoteCongress': 'KONGRE',");
code = code.replace(/'projects\.quotePackage': 'PACKAGE',/g, "'projects.quotePackage': 'PACKAGE',\n    'projects.quoteCongress': 'CONGRESS',");

fs.writeFileSync('src/lib/i18n.ts', code);
console.log("Fixed i18n!");
