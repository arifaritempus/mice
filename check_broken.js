const fs = require('fs');

const files = [
  'frontend/src/app/tickets/payments/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/sejour/page.tsx',
  'frontend/src/app/sejour/services/page.tsx',
  'frontend/src/app/quotes/page.tsx',
  'frontend/src/app/projects/page.tsx',
  'frontend/src/app/operations/transfers/page.tsx',
  'frontend/src/app/operations/tickets/page.tsx',
  'frontend/src/app/operations/part-time/page.tsx',
  'frontend/src/app/operations/guides/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  const hasUsage = content.includes('toCalendarYmd(');
  const hasDef = content.includes('const toCalendarYmd =');
  
  if (hasUsage && !hasDef) {
    console.log("Broken file (missing def):", file);
  }
}
