const fs = require('fs');

const files = [
  'frontend/src/app/quotes/page.tsx',
  'frontend/src/app/projects/page.tsx',
  'frontend/src/app/sejour/page.tsx',
  'frontend/src/app/sejour/services/page.tsx',
  'frontend/src/app/quotes/[id]/page.tsx',
  'frontend/src/app/projects/[id]/page.tsx',
  'frontend/src/app/sejour/[id]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Restore rigid tailwind arbitrary grid cols by stripping the responsive md: prefixes and duplicates
  content = content.replace(/className="grid[^"]*"/g, (match) => {
    // If it has grid-cols-[...] and md:grid-cols-[...], strip the responsive ones
    if (match.includes('md:grid-cols-[')) {
      // Find the first arbitrary bracket class
      const customMatch = match.match(/grid-cols-\[([^\]]+)\]/);
      if (customMatch) {
        return `className="grid w-full items-end gap-2 grid-cols-[${customMatch[1]}]"`;
      }
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Fixed grid in", file);
  }
});
