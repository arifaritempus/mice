const fs = require('fs');
const glob = require('glob');

const files = [
  'src/app/marketing/page.tsx',
  'src/app/operations/guides/page.tsx',
  'src/app/operations/part-time/page.tsx',
  'src/app/operations/tickets/page.tsx',
  'src/app/operations/transfers/page.tsx',
  'src/app/projects/page.tsx',
  'src/app/quotes/page.tsx',
  'src/app/sejour/page.tsx',
  'src/app/sejour/services/page.tsx',
  'src/app/tickets/calendar/page.tsx',
  'src/app/tickets/options/page.tsx',
  'src/app/tickets/payments/page.tsx',
  'src/app/accounting/invoices/page.tsx',
  'src/app/agencies/page.tsx',
  'src/app/hotels/page.tsx',
  'src/app/categories/page.tsx'
];

let updatedCount = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // We are looking for something like:
  // if (searchTerm) {
  //   const search = searchTerm.toLowerCase();
  //   filtered = filtered.filter(item =>
  //     item.company_name?.toLowerCase().includes(search) ||
  //     ...
  //   );
  // }
  
  // A regex to capture the conditions inside `item => ...`
  // We'll replace the block with a searchTokens-aware version.
  
  const regex = /if\s*\(\s*searchTerm\s*\)\s*\{\s*const\s+search\s*=\s*searchTerm\.toLowerCase\(\);\s*filtered\s*=\s*filtered\.filter\(\s*(?:item|p|q|t|ticket|transfer|guide|partTime|service)\s*=>\s*([\s\S]*?)\s*\);\s*\}/;
  
  const match = content.match(regex);
  if (match) {
    const conditions = match[1].trim();
    // The conditions string contains things like `item.company_name?.toLowerCase().includes(search) || ...`
    // We want to wrap this in a helper function.
    
    // Check if the file already has searchTokens in useMemo deps
    if (!content.includes('searchTokens')) {
      console.log(`Skipping ${file} - no searchTokens state found`);
      continue;
    }
    
    const replacement = `if (searchTerm || searchTokens.length > 0) {
      filtered = filtered.filter(item => {
        const matchesSearch = (term: string) => {
          const search = term.toLowerCase();
          return ${conditions.replace(/(item|p|q|t|ticket|transfer|guide|partTime|service)\./g, 'item.')};
        };

        let isMatch = true;
        if (searchTerm && !matchesSearch(searchTerm)) isMatch = false;
        if (searchTokens.length > 0 && !searchTokens.every(t => matchesSearch(t))) isMatch = false;
        return isMatch;
      });
    }`;
    
    content = content.replace(regex, replacement);
    
    // Now we must ensure searchTokens is in the dependency array of useMemo!
    // We'll find `[..., searchTerm, ...]` and add `searchTokens` if missing.
    // E.g. }, [quotes, searchTerm, statusFilter, dateStart, dateEnd]);
    
    // We can do a replace on the line right after `return filtered;`
    // Look for `}, [..., searchTerm`
    const useMemoEndRegex = /\},\s*\[(.*?)searchTerm(.*?)\]\);/g;
    content = content.replace(useMemoEndRegex, (match, before, after) => {
      if (match.includes('searchTokens')) return match;
      return `}, [${before}searchTerm, searchTokens${after}]);`;
    });
    
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${file}`);
  } else {
    console.log(`No match in ${file} or already updated`);
  }
}

console.log(`Successfully updated ${updatedCount} files.`);
