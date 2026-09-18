const fs = require('fs');
const f = 'frontend/src/app/quotes/view/[id]/page.tsx';
const lines = fs.readFileSync(f, 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('{ width: 45 }') || line.includes('sheet.getColumn')) {
    console.log(`Line ${i+1}:`, line);
  }
});
