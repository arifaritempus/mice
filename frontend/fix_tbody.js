const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');
content = content.replace(
    '<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">',
    '<tbody className="divide-y divide-white/5">'
);
fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
