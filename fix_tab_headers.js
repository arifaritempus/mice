const fs = require('fs');
const glob = require('glob'); // Not available? I'll just hardcode or fs.readdirSync
const path = require('path');

const dir = 'frontend/src/app/projects/[id]';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tab.tsx') || f.endsWith('TabSimple.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the specific container that has the h2 title
  const regex = /<div className="flex items-center justify-between">\s*<h2 className="[^"]+">(.*?)<\/h2>\s*<div className="flex items-center gap-2">/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, '<div className="flex flex-col md:flex-row md:items-center justify-between gap-2">\n        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">$1</h2>\n        <div className="flex flex-wrap items-center gap-2">');
    fs.writeFileSync(filePath, content);
    console.log(`Updated header in ${file}`);
  }
});
