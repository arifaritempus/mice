const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all generic card list items
content = content.replace(/bg-slate-50 dark:bg-slate-800\/50 rounded-2xl/g, 'bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors group/item');
content = content.replace(/text-slate-900 dark:text-white truncate/g, 'text-white truncate group-hover/item:text-blue-400 transition-colors');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cards in page.tsx');
