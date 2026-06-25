const fs = require('fs');
let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// fix searchTokens duplication
let lines = code.split('\n');
let newLines = [];
let foundSearchTokens = false;
for(let line of lines) {
  if (line.includes('const [searchTokens, setSearchTokens] = useState<string[]>([]);')) {
    if (!foundSearchTokens) {
      newLines.push(line);
      foundSearchTokens = true;
    }
  } else {
    newLines.push(line);
  }
}
code = newLines.join('\n');

// fix effectiveSearch
code = code.replace(/effectiveSearch/g, 'effectiveTokens.length > 0');

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS 3');
