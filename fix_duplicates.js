const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Find className="grid ... " strings
  content = content.replace(/className="grid[^"]*"/g, (match) => {
    // If it has multiple md:grid-cols, we need to clean it up
    let classes = match.split(' ');
    
    // We only want to keep the FIRST md:grid-cols-[...] if there are duplicates
    // And we should REMOVE md:grid-cols-2 if there is ANY md:grid-cols-[...]
    
    let hasCustomMdGrid = classes.some(c => c.startsWith('md:grid-cols-['));
    if (hasCustomMdGrid) {
      classes = classes.filter(c => c !== 'md:grid-cols-2');
    }
    
    // Filter duplicates of md:grid-cols-[...]
    let seenCustomGrid = false;
    classes = classes.filter(c => {
      if (c.startsWith('md:grid-cols-[')) {
        if (seenCustomGrid) return false;
        seenCustomGrid = true;
        return true;
      }
      return true;
    });

    return classes.join(' ');
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Fixed duplicates in", file);
  }
});
