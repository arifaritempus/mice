const fs = require('fs');
const glob = require('glob');
const path = require('path');

// get all tsx files
const files = glob.sync('frontend/src/app/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix double grid-cols-1 md:grid-cols-1 md:grid-cols-X
  content = content.replace(/grid-cols-1 md:grid-cols-1 md:grid-cols-(\d)/g, 'grid-cols-1 md:grid-cols-$1');
  
  // Fix grid-cols-[...] that lack md: prefixes
  // Example: grid w-full items-end gap-2 grid-cols-[1.7fr_1fr_1fr_1fr_1fr_1fr_auto]
  // Note: projects/page.tsx already has xl:grid-cols-, so we only target raw grid-cols-\[
  content = content.replace(/className="([^"]*)grid-cols-\[([^\]]+)\]([^"]*)"/g, (match, p1, p2, p3) => {
    // If it already has xl: or lg: or md: right before grid-cols-[, skip it
    if (match.includes('xl:grid-cols-[') || match.includes('lg:grid-cols-[') || match.includes('md:grid-cols-[')) {
      return match;
    }
    // Prefix it!
    return `className="${p1}grid w-full items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[${p2}]${p3}"`;
  });
  
  // Clean up any double generic grids
  content = content.replace(/grid w-full items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid w-full items-end gap-2/g, 'grid w-full items-end gap-2');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Cleaned up in:", file);
  }
}
