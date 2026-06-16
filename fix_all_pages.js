const fs = require('fs');
const path = require('path');

const filesToFix = [
  'frontend/src/app/projects/page.tsx',
  'frontend/src/app/quotes/page.tsx',
  'frontend/src/app/sejour/page.tsx',
  'frontend/src/app/sejour/services/page.tsx',
  'frontend/src/app/operations/tickets/page.tsx',
  'frontend/src/app/operations/transfers/page.tsx',
  'frontend/src/app/operations/guides/page.tsx',
  'frontend/src/app/operations/part-time/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/tickets/payments/page.tsx',
  'frontend/src/app/reports/page.tsx'
];

for (const file of filesToFix) {
  if (!fs.existsSync(file)) {
    console.log('Skipping', file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove inline DateRangeFieldProps
  content = content.replace(/interface DateRangeFieldProps \{[\s\S]*?onApply:[\s\S]*?\}\n/, '');

  // 2. Remove inline utils
  content = content.replace(/const toDate = \([\s\S]*?\};\n/g, '');
  content = content.replace(/const toIsoDate = \([\s\S]*?\n/g, '');
  content = content.replace(/const parseTypedDate = \([\s\S]*?\};\n/g, '');

  // 3. Remove function DateRangeField
  // Because it has nested brackets, regex is hard.
  // Instead, look for function DateRangeField and remove until the next function or export.
  const drfRegex = /function DateRangeField\([\s\S]*?\n(?=function |export |const |let |var )/;
  content = content.replace(drfRegex, '');

  // Wait, if it's the LAST function before export default, it might match export default?
  // Yes, (?=function |export ) will match.
  // Let's also do a second pass just in case there's any stray closing bracket.
  // Actually, replacing <DateRangeField with <ResponsiveDateRangeField
  content = content.replace(/<DateRangeField\b/g, '<ResponsiveDateRangeField');

  // 4. Add import at the top
  if (!content.includes('ResponsiveDateRangeField')) {
    content = content.replace(/import React/, "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport React");
  } else if (!content.includes("import ResponsiveDateRangeField")) {
    content = content.replace(/import React/, "import ResponsiveDateRangeField from '@/components/ResponsiveDateRangeField';\nimport React");
  }

  // 5. Replace import DateRangeField from '@/components/DateRangeField';
  content = content.replace(/import DateRangeField from '@\/components\/DateRangeField';/g, '');
  content = content.replace(/import \{ DateRangeField \} from '@\/components\/DateRangeField';/g, '');

  // 6. Fix filter container responsiveness
  // <div className="flex flex-wrap gap-4 items-end">
  // or <div className="p-4 flex flex-col md:flex-row md:items-end gap-4 ...">
  // Let's replace flex flex-wrap gap-4 with grid grid-cols-1 sm:flex sm:flex-wrap gap-4
  content = content.replace(/className="flex flex-wrap gap-4/g, 'className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4');
  content = content.replace(/className="flex flex-wrap items-end gap-4/g, 'className="grid grid-cols-1 sm:flex sm:flex-wrap items-end gap-4');
  content = content.replace(/className="flex items-center gap-4 flex-wrap/g, 'className="grid grid-cols-1 sm:flex sm:items-center gap-4 sm:flex-wrap');
  
  // For filters that are already p-4 flex flex-wrap ...
  content = content.replace(/className="p-4 flex flex-wrap/g, 'className="p-4 grid grid-cols-1 sm:flex sm:flex-wrap');

  // Find MultiTokenFilterInput and add w-full on it
  // Wait, MultiTokenFilterInput is usually inside the same file. It renders <div className="relative min-w-[200px]">
  // Let's just make MultiTokenFilterInput wrapper w-full.
  content = content.replace(/className="relative min-w-\[200px\]"/g, 'className="relative w-full sm:w-auto min-w-[200px]"');
  content = content.replace(/className="relative min-w-\[250px\]"/g, 'className="relative w-full sm:w-auto min-w-[250px]"');
  
  // Also standard <input> wrappers in filters
  // <div className="relative"> <label> <input />
  content = content.replace(/<div className="flex flex-col min-w-\[200px\]">/g, '<div className="flex flex-col w-full sm:w-auto min-w-[200px]">');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
