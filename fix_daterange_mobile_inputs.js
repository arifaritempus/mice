const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync("find frontend/src/app -name '*.tsx'").toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Make DateRangeField inputs stack on mobile
  content = content.replace(/<label([^>]*?)>\s*\{label\}\s*<\/label>\s*<div className="flex gap-0\.5">/g, 
    '<label$1>{label}</label>\n      <div className="flex flex-col sm:flex-row gap-0.5 w-full">'
  );
  
  content = content.replace(/<label([^>]*?)>\s*\{label\}\s*<\/label>\s*<div className="flex gap-1">/g, 
    '<label$1>{label}</label>\n      <div className="flex flex-col sm:flex-row gap-1 w-full">'
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Fixed DateRangeField stacking in", file);
  }
});
