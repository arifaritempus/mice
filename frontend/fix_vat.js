const fs = require('fs');
let file = 'src/lib/supabaseService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'vat_rate: cat.revenue_vat_rate ?? (item.vat || 0),',
  'vat_rate: item.vat || subCat.revenue_vat_rate || cat.revenue_vat_rate || 0,'
);

content = content.replace(
  'vat_rate: cat.expense_vat_rate ?? (item.vat || 0),',
  'vat_rate: item.vat || subCat.expense_vat_rate || cat.expense_vat_rate || 0,'
);

fs.writeFileSync(file, content, 'utf8');
