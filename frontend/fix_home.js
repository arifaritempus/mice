const fs = require('fs');
const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard card backgrounds with glass-card
content = content.replace(/bg-white dark:bg-slate-800\/80 rounded-2xl border border-slate-100 dark:border-slate-700/g, 'glass-card border border-white/5');
content = content.replace(/bg-slate-50 dark:bg-slate-800\/50 rounded-2xl/g, 'glass-card rounded-2xl');
content = content.replace(/bg-white dark:bg-slate-800 rounded-2xl/g, 'glass-card rounded-2xl');
content = content.replace(/bg-white dark:bg-\[#0b1120\]/g, 'bg-transparent');
content = content.replace(/bg-white\/80 dark:bg-\[#0b1120\]\/80 backdrop-blur-md/g, 'bg-transparent');
content = content.replace(/bg-slate-50\/50 dark:bg-\[#0b1120\]/g, 'bg-transparent');

// DashboardCard background replacement
content = content.replace(/bg-white dark:bg-slate-800\/80 rounded-3xl border border-slate-100 dark:border-slate-700\/50/g, 'glass-card');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed page.tsx');
