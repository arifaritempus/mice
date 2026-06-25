const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');
code = code.replace("    </div>\n  );\n}\n", "    </div>\n    </div>\n  );\n}\n");
fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
