const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Fix duplicate searchTokens
code = code.replace(
  /const \[searchTokens, setSearchTokens\] = useState<string\[\]>\(\[\]\);\n  const \[searchTokens, setSearchTokens\] = useState<string\[\]>\(\[\]\);/g,
  'const [searchTokens, setSearchTokens] = useState<string[]>([]);'
);
code = code.replace(
  /const \[searchInput, setSearchInput\] = useState\(''\);\n  const \[searchTokens, setSearchTokens\] = useState<string\[\]>\(\[\]\);\n  const \[appliedSearchInput, setAppliedSearchInput\] = useState\(''\);\n  const \[searchTokens, setSearchTokens\] = useState<string\[\]>\(\[\]\);/,
  "const [searchInput, setSearchInput] = useState('');\n  const [searchTokens, setSearchTokens] = useState<string[]>([]);\n  const [appliedSearchInput, setAppliedSearchInput] = useState('');"
);
// just to be safe, find multiple definitions and remove them
let matchCount = (code.match(/const \[searchTokens, setSearchTokens\] = useState<string\[\]>\(\[\]\);/g) || []).length;
if (matchCount > 1) {
  // Keep the first one, remove others
  let first = true;
  code = code.replace(/const \[searchTokens, setSearchTokens\] = useState<string\[\]>\(\[\]\);/g, (match) => {
    if (first) {
      first = false;
      return match;
    }
    return '';
  });
}

// 2. Fix trim() on searchTokens
// where is it? Line 363. Probably something like: `... || (searchTokens || '').trim() || ...`
// searchTokens is an array. We can use `searchTokens.length > 0`.
code = code.replace(
  /\(searchTokens \|\| ''\)\.trim\(\)/g,
  '(searchTokens && searchTokens.length > 0)'
);
code = code.replace(
  /searchTokens\.trim\(\)/g,
  '(searchTokens.length > 0)'
);
// Or maybe `const hasFilters = opsiyonDurumuFilter !== 'tum' || otelFilterInput.trim() || (searchTokens || '').trim();` ?
code = code.replace(
  /\(searchTokens \|\| \[\]\)\.length > 0/g, // just in case
  '(searchTokens.length > 0)'
);

// 3. Remove placeholder from MultiTokenFilterInput
code = code.replace(
  /<MultiTokenFilterInput[\s\S]*?placeholder="[^"]*"([\s\S]*?)\/>/g,
  `<MultiTokenFilterInput$1/>`
);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS errors');
