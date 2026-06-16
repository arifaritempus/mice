const fs = require('fs');
const path = require('path');

const pages = [
  'app/accounting/invoices/income/pending/page.tsx',
  'app/accounting/invoices/income/completed/page.tsx',
  'app/accounting/invoices/expense/pending/page.tsx',
  'app/accounting/invoices/expense/completed/page.tsx'
];

const basePath = '/Users/arifari/Desktop/TT_Sistem_AG/frontend/src';

pages.forEach(p => {
  const fullPath = path.join(basePath, p);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace h-[calc(100vh-2rem)] with min-h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)]
    content = content.replace(/h-\[calc\(100vh-2rem\)\]/g, 'min-h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)]');
    
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', p);
  }
});
