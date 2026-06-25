const fs = require('fs');

let content = fs.readFileSync('src/app/accounting/cash-flow/page.tsx', 'utf8');

// I will remove the extra `</div>` at the end until it matches
content = content.replace('    </div>\n    </div>\n  );\n}\n', '  );\n}\n');
fs.writeFileSync('src/app/accounting/cash-flow/page.tsx', content, 'utf8');
