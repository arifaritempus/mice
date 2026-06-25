const fs = require('fs');

let content = fs.readFileSync('src/app/accounting/cash-flow/page.tsx', 'utf8');

content = content.replace('  );\n}\n', '    </div>\n  );\n}\n');
fs.writeFileSync('src/app/accounting/cash-flow/page.tsx', content, 'utf8');
