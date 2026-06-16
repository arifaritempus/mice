const fs = require('fs');
const files = [
  "frontend/src/app/operations/guides/page.tsx",
  "frontend/src/app/operations/part-time/page.tsx",
  "frontend/src/app/operations/tickets/page.tsx",
  "frontend/src/app/operations/transfers/page.tsx",
  "frontend/src/app/tickets/payments/page.tsx",
  "frontend/src/app/sejour/page.tsx",
  "frontend/src/app/marketing/page.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the block: <div className="grid w-full min-w-0 items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
  const regex = /<div className="grid w-full min-w-0 items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* (Tickets Table|Content|Transfers Table|Guides Table|Tablo|Part-time Table|Sejour Table)/;
  
  const match = content.match(regex);
  if (!match) {
    console.log("No match found in", file);
    continue;
  }
  
  const innerHtml = match[1];
  let cols = [];
  
  // A crude way to count children:
  // Split by components
  const lines = innerHtml.split('\n');
  for (const line of lines) {
    if (line.includes('<DateRangeField')) cols.push('1.6fr');
    else if (line.includes('<MultiTokenFilterInput') || line.includes('<MultiSelectField') || line.includes('<SearchInput') || line.includes('<Select')) cols.push('1fr');
    else if (line.includes('<button') && line.includes('Filtreleri Temizle')) cols.push('auto');
    else if (line.includes('<button') && line.includes('Arama')) cols.push('auto');
    else if (line.includes('<input')) {
        // if it's not inside another component
        cols.push('1fr');
    }
  }
  
  // some files might have nested inputs so we refine:
  cols = [];
  const compMatches = innerHtml.match(/<DateRangeField|<MultiTokenFilterInput|<button[^>]*clearFilters[^>]*>|<button[^>]*Filtreleri Temizle[^>]*>|<select/g);
  if (compMatches) {
    for (const comp of compMatches) {
      if (comp.startsWith('<DateRangeField')) cols.push('1.6fr');
      else if (comp.startsWith('<MultiTokenFilterInput') || comp.startsWith('<select')) cols.push('1fr');
      else if (comp.startsWith('<button')) cols.push('auto');
    }
  }
  
  if (cols.length > 0) {
     const colsString = cols.join('_');
     const newGridClass = `grid w-full items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[${colsString}]`;
     content = content.replace('grid w-full min-w-0 items-end gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5', newGridClass);
     fs.writeFileSync(file, content);
     console.log("Fixed proportional grid in:", file, "Cols:", colsString);
  } else {
     console.log("Could not detect columns for", file);
  }
}
