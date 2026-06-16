const fs = require('fs');

const { execSync } = require('child_process');
const files = execSync("find frontend/src/app -name '*.tsx'").toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to add responsive-filter-grid to ANY div that is a grid used for filtering.
  // The simplest heuristic is: any className="grid ..." that contains "gap-2" or "gap-x-1" AND has style={{ gridTemplateColumns...}} OR grid-cols-[
  
  content = content.replace(/className="grid([^"]*?)(gap-2|gap-x-1)([^"]*?)"/g, (match, p1, p2, p3) => {
    if (!match.includes('responsive-filter-grid')) {
      return `className="grid${p1}${p2}${p3} responsive-filter-grid"`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Added responsive class to", file);
  }
});
