const fs = require('fs');

const filesToFix = [
  'frontend/src/app/operations/tickets/page.tsx',
  'frontend/src/app/operations/transfers/page.tsx',
  'frontend/src/app/operations/guides/page.tsx',
  'frontend/src/app/operations/part-time/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/tickets/payments/page.tsx',
  'frontend/src/app/projects/page.tsx',
  'frontend/src/app/quotes/page.tsx',
  'frontend/src/app/sejour/page.tsx',
  'frontend/src/app/sejour/services/page.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace standard inline gridTemplateColumns
  const regex = /className="([^"]*?grid[^"]*?)"\s*style=\{\{\s*gridTemplateColumns:\s*'([^']+)'\s*\}\}/g;
  content = content.replace(regex, (match, className, columns) => {
    // Replace spaces with underscores for Tailwind arbitrary value
    const tailwindCols = columns.trim().replace(/\s+/g, '_');
    // Ensure we don't duplicate classes, and add mobile responsiveness
    let newClass = className.replace('grid-cols-1', '').replace(/md:grid-cols-\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
    // Add new classes
    newClass = newClass + " grid-cols-1 md:grid-cols-[" + tailwindCols + "] gap-y-4 md:gap-y-1";
    return 'className="' + newClass + '"';
  });

  // For multi-line styles
  const multiRegex = /className="([^"]*?grid[^"]*?)"\s*style=\{\{\s*gridTemplateColumns:\s*'([^']+)'\s*\}\}/gm;
  // Actually regex with \s* matches across lines anyway.

  // Let's specifically handle tickets/options/page.tsx
  // It has:
  /*
  className="grid w-full min-w-0 items-end gap-x-1 gap-y-1"
  style={{ 
    gridTemplateColumns: '2fr 2fr 1.2fr 1.8fr 1.8fr 1.2fr 1.2fr auto'
  }}
  */
  const optionsRegex = /className="([^"]*?grid[^"]*?)"\s*style=\{\{\s*gridTemplateColumns:\s*'([^']+)'\s*\}\}/g;
  content = content.replace(optionsRegex, (match, className, columns) => {
    const tailwindCols = columns.trim().replace(/\s+/g, '_');
    let newClass = className.replace('grid-cols-1', '').replace(/md:grid-cols-\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
    newClass = newClass + " grid-cols-1 md:grid-cols-[" + tailwindCols + "] gap-y-4 md:gap-y-1";
    return 'className="' + newClass + '"';
  });

  fs.writeFileSync(file, content);
  console.log('Fixed grid in', file);
}
