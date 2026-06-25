const fs = require('fs');

const files = [
  'src/app/accounting/invoices/income/pending/page.tsx',
  'src/app/accounting/invoices/income/completed/page.tsx',
  'src/app/accounting/invoices/expense/pending/page.tsx',
  'src/app/accounting/invoices/expense/completed/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/opacity-0 group-hover:opacity-100/g, '');
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Fixed opacity");
