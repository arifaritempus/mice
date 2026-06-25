const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');
content = content.replace('</div>\n</div>\n{/* Data Table */}', '</div>\n</div>\n</div>\n{/* Data Table */}');
fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
