const fs = require('fs');

let code = fs.readFileSync('src/app/reports/page.tsx', 'utf8');

// Fix 1: duplicate searchTokens declaration
code = code.replace(
  /const \[searchTokens, setAppliedSearchInput\] = useState\(''\);/,
  "const [appliedSearchInput, setAppliedSearchInput] = useState('');"
);

// Fix 2: parameter passed to applyClientSearchTerms
code = code.replace(
  /const filteredRows = applyClientSearchTerms\(serverRows, effectiveTokens\.length > 0\);/,
  "const filteredRows = applyClientSearchTerms(serverRows, effectiveTokens);"
);

// Also since we use searchTokens instead of appliedSearchInput inside dependency array:
code = code.replace(/appliedSearchInput/g, 'searchTokens');

// Also remove `setAppliedSearchInput` usage since we replaced appliedSearchInput
// Just so we don't get "unused variable" error
code = code.replace(
  /const \[searchTokens, setAppliedSearchInput\] = useState\(''\);/g,
  ""
);

fs.writeFileSync('src/app/reports/page.tsx', code, 'utf8');
console.log('Fixed TS 4');
