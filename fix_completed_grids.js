const fs = require('fs');

const files = [
  'frontend/src/app/accounting/invoices/income/completed/page.tsx',
  'frontend/src/app/accounting/invoices/expense/completed/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/marketing/page.tsx',
  'frontend/src/app/accounting/cash-flow/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace lg:grid-cols-6 with the correct one for completed invoices
    if (file.includes('completed')) {
      content = content.replace(
        /lg:grid-cols-6/g,
        'xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]'
      );
      fs.writeFileSync(file, content);
      console.log("Fixed completed grids in", file);
    }
  }
}
