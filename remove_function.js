const fs = require('fs');

function removeFunction(filePath, funcName) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const funcStart = content.indexOf('function ' + funcName);
  if (funcStart === -1) return;

  let openBraces = 0;
  let started = false;
  let i = funcStart;
  
  for (; i < content.length; i++) {
    if (content[i] === '{') {
      openBraces++;
      started = true;
    } else if (content[i] === '}') {
      openBraces--;
    }
    
    if (started && openBraces === 0) {
      break;
    }
  }

  const funcEnd = i + 1;
  content = content.substring(0, funcStart) + content.substring(funcEnd);
  
  fs.writeFileSync(filePath, content);
  console.log('Removed', funcName, 'from', filePath);
}

const filesToFix = [
  'frontend/src/app/operations/part-time/page.tsx',
  'frontend/src/app/tickets/options/page.tsx',
  'frontend/src/app/tickets/payments/page.tsx'
];

for (const file of filesToFix) {
  removeFunction(file, 'DateRangeField');
}
