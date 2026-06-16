const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync("find frontend/src/app -name '*.tsx'").toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Make DateRangeField inputs stack on mobile
  content = content.replace(/<label([^>]*?)>\{label\}<\/label>\s*<div className="flex gap-1">/g, 
    '<label$1>{label}</label>\n      <div className="flex flex-col sm:flex-row gap-1 w-full">'
  );

  // Fix popup container (left-0)
  content = content.replace(
    /className="absolute left-0 top-full mt-1 z-50 min-w-\[560px\] /g, 
    'className="absolute left-0 top-full mt-1 z-50 min-w-[280px] w-[95vw] sm:w-auto sm:min-w-[560px] max-w-[100vw] '
  );
  
  // Fix popup container (right-0)
  content = content.replace(
    /className="absolute right-0 top-full mt-1 z-50 min-w-\[560px\] /g, 
    'className="absolute right-0 top-full mt-1 z-50 min-w-[280px] w-[95vw] sm:w-auto sm:min-w-[560px] max-w-[100vw] '
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Fixed calendar in", file);
  }
});
