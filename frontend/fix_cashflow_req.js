const fs = require('fs');

let file = 'src/app/accounting/cash-flow/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove .replace(/[^\d,. ]/g, '') everywhere
content = content.replace(/\.replace\(\/\[\^\\d,\. \]\/g, ''\)/g, '');

// 2. Remove the Stats Section
const statsSectionRegex = /\{\/\* Stats Section \*\/\}\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-4">[\s\S]*?<div className="md:col-span-2 hidden md:block" \/>\s*<\/div>/;
content = content.replace(statsSectionRegex, '');

fs.writeFileSync(file, content, 'utf8');
