const { execSync } = require('child_process');
const fs = require('fs');

const diff = execSync('git diff HEAD frontend/src/app').toString();
const files = diff.split(/^diff --git a\/(frontend\/src\/app\/.*?) b\//m).slice(1);

for (let i = 0; i < files.length; i += 2) {
  const file = files[i];
  const fileDiff = files[i+1];
  
  // Find the original gridTemplateColumns
  const oldMatch = fileDiff.match(/-\s*<div\s+className="grid[^"]*"\s*style=\{\{\s*gridTemplateColumns:\s*'([^']+)'\s*\}\}/);
  const oldMatchMultiLine = fileDiff.match(/-\s*(?:<div\s+className="grid[^"]*"\s*|)style=\{\{\s*\n-\s*gridTemplateColumns:\s*'([^']+)'/);
  
  const styleString = oldMatch ? oldMatch[1] : (oldMatchMultiLine ? oldMatchMultiLine[1] : null);
  
  if (styleString) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the current grid class that has our responsive nonsense
    // with the original grid class and style!
    
    content = content.replace(
      /<div\s+key=\{filterKey\}\s+className="bg-white[^>]*>\s*<div\s+className="grid[^>]*>/,
      (match) => {
        // Strip out the current <div className="grid ..."> and replace with the rigid one
        return match.replace(/<div\s+className="grid[^>]*>/, `<div className="grid w-full min-w-0 items-end gap-2" style={{ gridTemplateColumns: '${styleString}' }}>`);
      }
    );
    
    // Also try without filterKey just in case
    content = content.replace(
      /<div\s+className="grid[^"]*"\s*>/g,
      (match) => {
        if (match.includes('grid-cols-')) {
          return `<div className="grid w-full min-w-0 items-end gap-2" style={{ gridTemplateColumns: '${styleString}' }}>`;
        }
        return match;
      }
    );

    fs.writeFileSync(file, content);
    console.log("Restored strict desktop grid in", file);
  }
}
