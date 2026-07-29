const fs = require('fs');
const content = fs.readFileSync('/Users/arifari/Desktop/TT_Sistem_AG kopyası/frontend/src/app/projects/[id]/page.tsx', 'utf8');

const regex = /sheet\.mergeCells\("A1:([A-Z])1"\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Line ${content.substring(0, match.index).split('\n').length}: Merges up to ${match[1]}`);
}
