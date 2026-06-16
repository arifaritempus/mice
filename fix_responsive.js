const fs = require('fs');

// 1. Fix InvoiceItemTable.tsx min-width
const invoiceTablePath = 'frontend/src/components/accounting/InvoiceItemTable.tsx';
let invoiceTable = fs.readFileSync(invoiceTablePath, 'utf8');
invoiceTable = invoiceTable.replace(
  '<table className="min-w-full divide-y',
  '<table className="min-w-[900px] divide-y'
);
fs.writeFileSync(invoiceTablePath, invoiceTable);
console.log("Fixed InvoiceItemTable.tsx");

// 2. Fix Completed Invoice grids
const completedFiles = [
  'frontend/src/app/accounting/invoices/income/completed/page.tsx',
  'frontend/src/app/accounting/invoices/expense/completed/page.tsx'
];
for (const file of completedFiles) {
  let content = fs.readFileSync(file, 'utf8');
  // It looks like:
  //         <div
  //           className="grid w-full min-w-0 items-end gap-2"
  //           style={{
  //             gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr)'
  //           }}
  //         >
  const badGridMatch = /<div\s+className="grid w-full min-w-0 items-end gap-2"\s+style=\{\{\s+gridTemplateColumns:\s+'minmax[^}]+'[^}]+\}\}\s*>/;
  content = content.replace(badGridMatch, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 w-full min-w-0 items-end gap-3">');
  fs.writeFileSync(file, content);
  console.log("Fixed grid in", file);
}

// 3. Fix Reports page flex container
const reportsPath = 'frontend/src/app/reports/page.tsx';
let reports = fs.readFileSync(reportsPath, 'utf8');
reports = reports.replace(
  'className="flex flex-row items-center gap-4 flex-wrap lg:flex-nowrap"',
  'className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap lg:flex-nowrap"'
);
// Make the presets and dates take full width on mobile if needed, or wrap nicely.
// "inline-flex bg-white" -> "flex flex-wrap sm:inline-flex bg-white"
reports = reports.replace(
  'className="inline-flex bg-white dark:bg-slate-900',
  'className="flex flex-wrap sm:inline-flex bg-white dark:bg-slate-900'
);
fs.writeFileSync(reportsPath, reports);
console.log("Fixed reports flex layout");

