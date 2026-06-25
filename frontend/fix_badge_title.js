const fs = require('fs');
let file = 'src/app/accounting/invoices/income/pending/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Seçilen Kalemlerin Toplamı</h4>',
  '<h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Seçilen Kalemlerin Toplamı ({selectedItems.length} Kalem)</h4>'
);

fs.writeFileSync(file, content, 'utf8');
