const fs = require('fs');

// 1. Fix PaginationControls
const paginationFile = 'frontend/src/components/PaginationControls.tsx';
let paginationContent = fs.readFileSync(paginationFile, 'utf8');
paginationContent = paginationContent.replace(
  'className="flex flex-nowrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300"',
  'className="flex flex-wrap justify-center sm:justify-end items-center gap-2 text-xs text-gray-600 dark:text-gray-300"'
);
fs.writeFileSync(paginationFile, paginationContent);
console.log("Fixed PaginationControls");

// 2. Fix Grid and Header in all 4 invoice pages
const invoiceFiles = [
  'frontend/src/app/accounting/invoices/income/pending/page.tsx',
  'frontend/src/app/accounting/invoices/expense/pending/page.tsx',
  'frontend/src/app/accounting/invoices/income/completed/page.tsx',
  'frontend/src/app/accounting/invoices/expense/completed/page.tsx'
];

for (const file of invoiceFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix grid cols
    content = content.replace(
      /lg:grid-cols-6/g,
      'lg:grid-cols-[240px_1fr_1fr_1fr_1fr_1fr]'
    );

    // Fix header
    // from: className="flex flex-col md:flex-row md:items-start justify-start gap-6"
    // to:   className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    content = content.replace(
      'className="flex flex-col md:flex-row md:items-start justify-start gap-6"',
      'className="flex flex-col md:flex-row md:items-center justify-between gap-4"'
    );

    fs.writeFileSync(file, content);
    console.log("Fixed layout in", file);
  }
}
