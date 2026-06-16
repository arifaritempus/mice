const fs = require('fs');

const files = [
  'frontend/src/app/accounting/invoices/income/pending/page.tsx',
  'frontend/src/app/accounting/invoices/income/completed/page.tsx',
  'frontend/src/app/accounting/invoices/expense/pending/page.tsx',
  'frontend/src/app/accounting/invoices/expense/completed/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("Not found:", file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the pending pages grid
  if (content.includes("style={{ gridTemplateColumns: '180px 1fr 1fr 1fr 1fr 1fr' }}")) {
    content = content.replace(
      "className=\"grid w-full min-w-0 items-end gap-2\" style={{ gridTemplateColumns: '180px 1fr 1fr 1fr 1fr 1fr' }}",
      "className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 w-full min-w-0 items-end gap-3\""
    );
    console.log("Fixed grid in", file);
  }
  
  // Replace the completed pages grid
  if (content.includes("gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr)'")) {
    content = content.replace(
      "className=\"grid w-full min-w-0 items-end gap-2\"\n            style={{\n              gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,0.95fr)'\n            }}",
      "className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 w-full min-w-0 items-end gap-3\""
    );
    // Might have different formatting, let's do a regex
    content = content.replace(
      /<div\s+className="grid w-full min-w-0 items-end gap-2"\s+style=\{\{\s+gridTemplateColumns:\s+'minmax\(0,1\.25fr\) minmax\(0,0\.95fr\) minmax\(0,0\.95fr\) minmax\(0,0\.95fr\) minmax\(0,0\.95fr\) minmax\(0,0\.95fr\)'\s+\}\}>/,
      '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 w-full min-w-0 items-end gap-3">'
    );
    console.log("Fixed grid in", file);
  }

  fs.writeFileSync(file, content);
}
