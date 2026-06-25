const fs = require('fs');

const files = [
  'src/app/accounting/invoices/income/pending/page.tsx',
  'src/app/accounting/invoices/expense/pending/page.tsx',
  'src/app/accounting/invoices/income/completed/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<div className="h-full w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">',
    '<div className="h-[calc(100vh-2rem)] w-full p-6 sm:p-8 flex flex-col gap-6 overflow-hidden font-sans text-white">'
  );
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Fixed h-full");
