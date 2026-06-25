const fs = require('fs');

let content = fs.readFileSync('src/app/sejour/page.tsx', 'utf8');

const startStr = 'function MultiTokenFilterInput({';
const startIdx = content.indexOf(startStr);
const endStr = '  );\n}\n\nexport default function SejourPage() {';
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx + 7);
  fs.writeFileSync('src/app/sejour/page.tsx', content, 'utf8');
  console.log("Deleted local MultiTokenFilterInput");
} else {
  console.log("Could not find MultiTokenFilterInput to delete");
}
