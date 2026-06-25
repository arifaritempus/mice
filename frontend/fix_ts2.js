const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// 1. Fix line 363
// Old: const effectiveSearch = (params?.searchValue ?? searchTokens).trim();
//      const searchTerms = parseSearchTerms(effectiveSearch);
//      const hasMultiSearch = searchTerms.length > 1;
// New: const effectiveTokens = params?.searchValue ? [params.searchValue] : searchTokens;
//      const hasMultiSearch = effectiveTokens.length > 1;
code = code.replace(
  /const effectiveSearch = \(params\?\.searchValue \?\? searchTokens\)\.trim\(\);\n\s*const searchTerms = parseSearchTerms\(effectiveSearch\);\n\s*const hasMultiSearch = searchTerms\.length > 1;/g,
  `const effectiveTokens = params?.searchValue ? [params.searchValue] : searchTokens;
      const searchTerms = effectiveTokens;
      const hasMultiSearch = effectiveTokens.length > 1;`
);

// We need to make sure the fetch request uses searchTerms
// Old: url += \`&search=\${encodeURIComponent(effectiveSearch)}\`;
// New: url += \`&search=\${encodeURIComponent(effectiveTokens.join(' '))}\`;
code = code.replace(
  /url \+= `&search=\${encodeURIComponent\(effectiveSearch\)}`;/g,
  "url += `&search=${encodeURIComponent(effectiveTokens.join(' '))}`;"
);

code = code.replace(
  /const hasFilters = opsiyonDurumuFilter !== 'tum' \|\| otelFilterInput\.trim\(\) \|\| effectiveSearch;/g,
  "const hasFilters = opsiyonDurumuFilter !== 'tum' || otelFilterInput.trim() || effectiveTokens.length > 0;"
);

// 2. Fix MultiTokenFilterInput
const mtFilterRegex = /<MultiTokenFilterInput[\s\S]*?\/>/;
const mtFilterReplacement = `<MultiTokenFilterInput
                  label="Arama"
                  inputValue={searchInput}
                  onInputChange={setSearchInput}
                  tokens={searchTokens}
                  suggestions={[]}
                  onAddToken={(t) => {
                    if (!searchTokens.includes(t)) {
                      setSearchTokens([...searchTokens, t]);
                      setSearchInput('');
                    }
                  }}
                  onRemoveToken={(t) => {
                    setSearchTokens(searchTokens.filter(st => st !== t));
                  }}
                />`;

code = code.replace(mtFilterRegex, mtFilterReplacement);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS 2');
