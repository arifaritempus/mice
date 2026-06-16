const fs = require('fs');
const files = [
  "frontend/src/app/operations/guides/page.tsx",
  "frontend/src/app/operations/part-time/page.tsx",
  "frontend/src/app/operations/tickets/page.tsx",
  "frontend/src/app/operations/transfers/page.tsx",
  "frontend/src/app/tickets/payments/page.tsx",
  "frontend/src/app/tickets/options/page.tsx",
  "frontend/src/app/sejour/page.tsx",
  "frontend/src/app/sejour/services/page.tsx",
  "frontend/src/app/marketing/page.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the block using the generic grid class
  const regex = /(<div[^>]*className="[^"]*grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5[^"]*"[^>]*>)([\s\S]*?)(?=<\/div>\s*<\/div>\s*<div)/;
  
  let match = content.match(regex);
  if (!match) {
    // try another regex if there is no following sibling div
    const fallbackRegex = /(<div[^>]*className="[^"]*grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5[^"]*"[^>]*>)([\s\S]*?)(?=<\/div>\s*<\/div>)/;
    match = content.match(fallbackRegex);
  }

  if (!match) {
    console.log("No match found in", file);
    continue;
  }
  
  const fullMatch = match[0];
  const divTag = match[1];
  const innerHtml = match[2];
  
  let cols = [];
  const compMatches = innerHtml.match(/<DateRangeField|<MultiTokenFilterInput|<MultiSelectField|<SearchInput|<select|<button/g);
  
  if (compMatches) {
    for (const comp of compMatches) {
      if (comp.startsWith('<DateRangeField')) cols.push('1.6fr');
      else if (comp.startsWith('<button')) cols.push('auto');
      else cols.push('1fr');
    }
  }
  
  if (cols.length > 0) {
     const colsString = cols.join('_');
     const newGridClass = `grid w-full items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[${colsString}]`;
     const newDivTag = divTag.replace(/grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5/g, `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[${colsString}]`);
     content = content.replace(divTag, newDivTag);
     fs.writeFileSync(file, content);
     console.log("Fixed proportional grid in:", file, "Cols:", colsString);
  } else {
     console.log("Could not detect columns for", file);
  }
}
