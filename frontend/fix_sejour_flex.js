const fs = require('fs');
let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

// Replace w-[200px] shrink-0 with flex-1 min-w-[160px]
content = content.replace(/w-\[200px\] shrink-0/g, 'flex-1 min-w-[160px]');
// Replace w-[240px] shrink-0 with flex-1 min-w-[200px]
content = content.replace(/w-\[240px\] shrink-0/g, 'flex-1 min-w-[200px]');

fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
console.log("Updated filter widths!");
