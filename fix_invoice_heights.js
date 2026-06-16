const fs = require('fs');

const files = [
  'frontend/src/app/accounting/invoices/income/pending/page.tsx',
  'frontend/src/app/accounting/invoices/expense/pending/page.tsx',
  'frontend/src/app/accounting/invoices/income/completed/page.tsx',
  'frontend/src/app/accounting/invoices/expense/completed/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /className="flex flex-col h-\[calc\(100vh-2rem\)\]/g,
      'className="flex flex-col min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)]'
    );
    fs.writeFileSync(file, content);
    console.log("Fixed height in", file);
  }
}
