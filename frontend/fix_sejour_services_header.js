const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/services/page.tsx', 'utf8');

// 1. Remove the existing "Modern Tabs" section from above the Unified Header
const modernTabsRegex = /{\/\* Modern Tabs \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/; 
// Wait, the above regex is tricky. Let's do it carefully.
