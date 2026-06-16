const fs = require('fs');
const files = [
  "frontend/src/app/sejour/page.tsx",
  "frontend/src/app/sejour/services/page.tsx",
  "frontend/src/app/operations/tickets/page.tsx",
  "frontend/src/app/operations/transfers/page.tsx",
  "frontend/src/app/operations/guides/page.tsx",
  "frontend/src/app/operations/part-time/page.tsx",
  "frontend/src/app/tickets/options/page.tsx",
  "frontend/src/app/tickets/payments/page.tsx",
  "frontend/src/app/tickets/calendar/page.tsx",
  "frontend/src/app/marketing/page.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("Missing:", file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix hardcoded gridTemplateColumns in filters
  content = content.replace(/style={{ gridTemplateColumns:[^}]+}}/g, "className=\"grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-auto-fit gap-2\"");

  // Fix grid-cols-X without md:
  content = content.replace(/className="([^"]*)grid-cols-2([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols')) return match;
    return `className="${p1}grid-cols-1 md:grid-cols-2${p2}"`;
  });
  
  content = content.replace(/className="([^"]*)grid-cols-3([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols')) return match;
    return `className="${p1}grid-cols-1 md:grid-cols-3${p2}"`;
  });

  content = content.replace(/className="([^"]*)grid-cols-4([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols')) return match;
    return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-4${p2}"`;
  });

  content = content.replace(/className="([^"]*)grid-cols-5([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols')) return match;
    return `className="${p1}grid-cols-1 md:grid-cols-3 lg:grid-cols-5${p2}"`;
  });

  // Fix headers that use flex justify-between items-center with bg-white/mb-4
  content = content.replace(/className="([^"]*)flex justify-between items-center([^"]*(?:mb-[0-9]|bg-white)[^"]*)"/g, `className="$1flex flex-col md:flex-row justify-between items-start md:items-center gap-4$2"`);
  content = content.replace(/className="([^"]*)flex items-center justify-between([^"]*(?:mb-[0-9]|bg-white)[^"]*)"/g, `className="$1flex flex-col md:flex-row justify-between items-start md:items-center gap-4$2"`);

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Fixed:", file);
  } else {
    console.log("No changes:", file);
  }
}
