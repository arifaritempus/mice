const fs = require('fs');

let file = 'src/app/projects/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '    if (globalTokens.length > 0) {',
  `    const searchTerms = [...globalTokens, globalInput.trim()].filter(Boolean);
    if (searchTerms.length > 0) {`
);

content = content.replace(
  '      const match = globalTokens.every(token => {',
  '      const match = searchTerms.every(token => {'
);

fs.writeFileSync(file, content, 'utf8');
