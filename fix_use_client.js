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

  // If the file starts with the import, AND has 'use client' later
  if (content.startsWith("import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\n'use client'")) {
    content = content.replace(
      "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\n'use client'",
      "'use client'\nimport ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';"
    );
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
