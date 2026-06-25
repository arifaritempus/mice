const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/app/projects/[id]';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tab.tsx') || f.endsWith('TabSimple.tsx') || f.endsWith('FinancialTab.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the first occurrence of <div className="flex items-center justify-between">
  // Since the headers are always at the top of the component return
  let replaced = false;
  
  // Replace only the first instance of justify-between that appears after space-y-3
  // or generally the first one if it's right after space-y-3
  content = content.replace(
    /<div className="space-y-3">\s*<div className="flex items-center justify-between">/g,
    '<div className="space-y-3">\n      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">'
  );
  
  // Also replace any <div className="flex items-center gap-2"> that might be inside these headers
  // We'll just replace all of them that have buttons inside, or just all of them to be safe?
  // It's safer to just let them wrap if they overflow.
  content = content.replace(
    /<div className="flex items-center gap-2">/g,
    '<div className="flex flex-wrap items-center gap-2">'
  );

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
