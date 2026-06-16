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
  
  // Remove all occurrences of the import (even with slightly different quotes or spacing)
  const lines = content.split('\n');
  const cleanLines = lines.filter(line => 
    !line.includes('import DateRangeField from "@/components/DateRangeField"') &&
    !line.includes("import DateRangeField from '@/components/DateRangeField'")
  );
  
  // Find where to insert
  let insertIndex = 0;
  for (let i = 0; i < cleanLines.length; i++) {
    if (cleanLines[i].includes('use client')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  cleanLines.splice(insertIndex, 0, "import DateRangeField from '@/components/DateRangeField';");
  
  fs.writeFileSync(file, cleanLines.join('\n'));
  console.log("Guaranteed import in:", file);
}
