const fs = require('fs');

const filesToFix = [
  'frontend/src/app/operations/guides/page.tsx',
  'frontend/src/app/operations/part-time/page.tsx',
  'frontend/src/app/operations/tickets/page.tsx',
  'frontend/src/app/operations/transfers/page.tsx',
  'frontend/src/app/projects/page.tsx',
  'frontend/src/app/quotes/page.tsx',
  'frontend/src/app/sejour/page.tsx',
  'frontend/src/app/sejour/services/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/tickets/payments/page.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  // Check if imported
  if (!content.includes("import ResponsiveDateRangeField")) {
    // Add at the top, just below 'use client'; if present
    if (content.includes("'use client';")) {
      content = content.replace(/'use client';/, "'use client';\nimport ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';");
    } else {
      content = "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\n" + content;
    }
  }

  fs.writeFileSync(file, content);
  console.log('Added import to', file);
}
