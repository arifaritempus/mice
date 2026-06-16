const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync("find frontend/src/app -name '*.tsx'").toString().split('\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Fix popup container
  content = content.replace(
    /className="absolute left-0 top-full mt-1 z-50 min-w-\[560px\] /g, 
    'className="absolute left-0 top-full mt-1 z-50 min-w-[280px] w-[95vw] sm:w-auto sm:min-w-[560px] max-w-[100vw] '
  );
  
  content = content.replace(
    /className="absolute right-0 top-full mt-1 z-50 min-w-\[560px\] /g, 
    'className="absolute right-0 top-full mt-1 z-50 min-w-[280px] w-[95vw] sm:w-auto sm:min-w-[560px] max-w-[100vw] '
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Fixed calendar popup in", file);
  }
});
