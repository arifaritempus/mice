const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

content = content.replace(/categories: \[\],\n      projects: \[\],\n    salesItems: \[\],\n    purchaseItems: \[\],\n    categories: \[\],/, 'projects: [],\n    salesItems: [],\n    purchaseItems: [],\n    categories: [],');

fs.writeFileSync('src/app/dashboard/page.tsx', content);
