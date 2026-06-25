const fs = require('fs');

const files = [
  'src/app/accounting/invoices/income/pending/page.tsx',
  'src/app/accounting/invoices/expense/pending/page.tsx',
  'src/app/accounting/invoices/income/completed/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<div className="w-full min-w-0 flex-1 flex flex-col">',
    '<div className="w-full min-w-0 flex-1 flex flex-col min-h-0">'
  );
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Fixed min-h-0");
