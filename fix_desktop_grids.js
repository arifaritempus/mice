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

let globalCssAdditions = '\n/* Custom Desktop Grids for Operations */\n@media (min-width: 768px) {\n';
let cssCounter = 1;

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  // We want to find md:grid-cols-[...] and replace it with a custom class
  const regex = /md:grid-cols-\[([^\]]+)\]/g;
  content = content.replace(regex, (match, cols) => {
    const cssCols = cols.replace(/_/g, ' '); // back to spaces
    const className = `custom-desktop-grid-${cssCounter}`;
    globalCssAdditions += `  .${className} {\n    grid-template-columns: ${cssCols} !important;\n  }\n`;
    cssCounter++;
    return `md:grid-cols-none ${className}`;
  });

  fs.writeFileSync(file, content);
  console.log('Processed', file);
}

globalCssAdditions += '}\n';
fs.appendFileSync('frontend/src/app/globals.css', globalCssAdditions);
console.log('Appended to globals.css');

