const fs = require('fs');
let content = fs.readFileSync('src/app/operations/tickets/page.tsx', 'utf8');

// The `loadData` function uses `searchTerm: '',`. Let's change it to `searchTerm: pnrTokens.join(' '),` so it acts as a global search. 
// Or better yet, we can pass it to `searchTerm: JSON.stringify(pnrTokens)`.
// Actually, `searchTerm: pnrTokens.join(' ')` is standard for full-text search. Let's do that.

content = content.replace(
  "searchTerm: '',",
  "searchTerm: pnrTokens.join(' '),"
);

fs.writeFileSync('src/app/operations/tickets/page.tsx', content, 'utf8');
console.log("Search patched");
