const fs = require('fs');

const filesToFix = [
  'frontend/src/app/operations/part-time/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/tickets/payments/page.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/interface DateRangeFieldProps \{[\s\S]*?onApply:[\s\S]*?\}\n/, '');
  content = content.replace(/const toDate = \([\s\S]*?\};\n/g, '');
  content = content.replace(/const toIsoDate = \([\s\S]*?\n/g, '');
  content = content.replace(/const parseTypedDate = \([\s\S]*?\};\n/g, '');

  content = content.replace(/<DateRangeField\b/g, '<ResponsiveDateRangeField');

  if (!content.includes('ResponsiveDateRangeField')) {
    content = content.replace(/import React/, "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport React");
  } else if (!content.includes("import ResponsiveDateRangeField")) {
    content = content.replace(/import React/, "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport React");
  }

  content = content.replace(/import DateRangeField from '@\/components\/DateRangeField';/g, '');
  content = content.replace(/import \{ DateRangeField \} from '@\/components\/DateRangeField';/g, '');

  content = content.replace(/className="flex flex-wrap gap-4/g, 'className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4');
  content = content.replace(/className="flex flex-wrap items-end gap-4/g, 'className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-4');
  content = content.replace(/className="flex items-center gap-4 flex-wrap/g, 'className="grid grid-cols-1 sm:flex sm:items-center gap-4 sm:flex-wrap');
  content = content.replace(/className="p-4 flex flex-wrap/g, 'className="p-4 grid grid-cols-1 sm:flex sm:flex-wrap');

  content = content.replace(/className="relative min-w-\[200px\]"/g, 'className="relative w-full sm:w-auto min-w-[200px]"');
  content = content.replace(/className="relative min-w-\[250px\]"/g, 'className="relative w-full sm:w-auto min-w-[250px]"');
  content = content.replace(/<div className="flex flex-col min-w-\[200px\]">/g, '<div className="flex flex-col w-full sm:w-auto min-w-[200px]">');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
