const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Replace the main wrapper layout
pageContent = pageContent.replace(
  /<div className="flex flex-col h-screen overflow-hidden pt-4 pb-4 px-4 gap-4">/g,
  '<div className="flex flex-col min-h-screen pt-4 pb-10 px-4 gap-4">'
);

// Replace the flex-1 overflow-y-auto wrapper
pageContent = pageContent.replace(
  /<div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">/g,
  '<div className="flex-1 pr-2 relative">'
);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("Main wrappers fixed");
