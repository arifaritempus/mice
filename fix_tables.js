const fs = require('fs');

const completedFiles = [
  'frontend/src/app/accounting/invoices/income/completed/page.tsx',
  'frontend/src/app/accounting/invoices/expense/completed/page.tsx'
];

for (const file of completedFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<table className="min-w-full divide-y',
    '<table className="min-w-[900px] xl:min-w-full divide-y'
  );
  fs.writeFileSync(file, content);
  console.log("Fixed table width in", file);
}
