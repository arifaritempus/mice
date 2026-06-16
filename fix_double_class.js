const fs = require('fs');
const files = [
  "frontend/src/app/operations/guides/page.tsx",
  "frontend/src/app/operations/part-time/page.tsx",
  "frontend/src/app/operations/tickets/page.tsx",
  "frontend/src/app/operations/transfers/page.tsx",
  "frontend/src/app/tickets/payments/page.tsx",
  "frontend/src/app/sejour/page.tsx",
  "frontend/src/app/marketing/page.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // The string that needs to be fixed:
  // className="grid w-full min-w-0 items-end gap-x-1 gap-y-1" className="grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-auto-fit gap-2"
  
  content = content.replace(/className="grid w-full min-w-0 items-end gap-x-1 gap-y-1" className="grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-auto-fit gap-2"/g, 
    `className="grid w-full min-w-0 items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"`);

  fs.writeFileSync(file, content);
  console.log("Fixed double className in:", file);
}
