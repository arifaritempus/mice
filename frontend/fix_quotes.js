const fs = require('fs');

let file = 'src/app/quotes/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '    if (appliedGlobalTokens.length > 0) {',
  `    const searchTerms = [...appliedGlobalTokens, globalInput.trim()].filter(Boolean);
    if (searchTerms.length > 0) {`
);

content = content.replace(
  '      const match = appliedGlobalTokens.every(token => {',
  '      const match = searchTerms.every(token => {'
);

fs.writeFileSync(file, content, 'utf8');
