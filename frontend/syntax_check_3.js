const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Syntax is perfectly valid.");
} catch (e) {
  console.log("Syntax Error:", e.message);
  console.log("Line:", e.loc.line, "Column:", e.loc.column);
}
