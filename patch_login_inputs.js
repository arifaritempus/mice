const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/login/page.tsx', 'utf8');

// Replace text-sm with text-base for the inputs
content = content.replace(
  /className="w-full px-4 py-2.5 rounded-xl bg-white\/5 border border-white\/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500\/60 focus:border-blue-500\/60 transition-all duration-200"/g,
  'className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60 transition-all duration-200"'
);

fs.writeFileSync('frontend/src/app/login/page.tsx', content);
console.log('Login inputs patched.');
