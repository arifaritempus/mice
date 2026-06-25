const fs = require('fs');
let content = fs.readFileSync('src/app/projects/page.tsx', 'utf8');

const oldClear = `              onClick={() => {
                setFilter('all');
                setSearchTerm('');
                setDateStart('');
                setDateEnd('');
                setDraftOrgDateStart('');
                setDraftOrgDateEnd('');
                setGlobalTokens([]);
                setGlobalInput('');
                setPage(1);
              }}`;
              
const newClear = `              onClick={() => {
                setFilter('all');
                setSearchTerm('');
                setDateStart('');
                setDateEnd('');
                setDraftOrgDateStart('');
                setDraftOrgDateEnd('');
                setAppliedOrgDateStart('');
                setAppliedOrgDateEnd('');
                setGlobalTokens([]);
                setGlobalInput('');
                setPage(1);
              }}`;

if (content.includes(oldClear)) {
  content = content.replace(oldClear, newClear);
  fs.writeFileSync('src/app/projects/page.tsx', content, 'utf8');
  console.log("Fixed clear filters in projects");
} else {
  console.log("Could not find oldClear in projects");
}
