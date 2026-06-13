const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.next')) {
        filelist = walkSync(filepath, filelist);
      }
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.jsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src', 'app'));

let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Change basic grid-cols-2 and grid-cols-3 and grid-cols-4 that don't have md: prefixes yet
  content = content.replace(/className="(.*?)grid grid-cols-2([^"]*)"/g, (match, before, after) => {
    // Only replace if it doesn't already have md:grid-cols
    if (match.includes('md:grid-cols')) return match;
    if (match.includes('sm:grid-cols')) return match;
    return `className="${before}grid grid-cols-1 md:grid-cols-2${after}"`;
  });

  content = content.replace(/className="(.*?)grid grid-cols-3([^"]*)"/g, (match, before, after) => {
    if (match.includes('md:grid-cols')) return match;
    if (match.includes('sm:grid-cols')) return match;
    return `className="${before}grid grid-cols-1 md:grid-cols-3${after}"`;
  });

  content = content.replace(/className="(.*?)grid grid-cols-4([^"]*)"/g, (match, before, after) => {
    if (match.includes('md:grid-cols')) return match;
    if (match.includes('sm:grid-cols')) return match;
    return `className="${before}grid grid-cols-1 md:grid-cols-4${after}"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed grid in:', file);
  }
});

console.log(`Updated ${changedCount} files with responsive grid classes.`);
