const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', 'utf8');

// Fix Kayıt Tab span (might be there twice if Uçak also matched, but it's ok)
code = code.replace(
  /<div className="md:col-span-2 md:col-start-3">\s*<label className="block text-\[10px\] font-black text-v3-muted uppercase mb-1">Tutar & Döviz<\/label>/g,
  '<div className="md:col-span-4 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">\n                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>'
);

// Fix Konaklama Tab span
code = code.replace(
  /<div className="md:col-span-2">\s*<label className="block text-\[10px\] font-black text-v3-muted uppercase mb-1">Tutar & Döviz<\/label>/g,
  '<div className="md:col-span-5 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">\n                      <label className="block text-[10px] font-black text-v3-muted uppercase mb-1">Tutar & Döviz</label>'
);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', code);
console.log("Fixed spans!");
