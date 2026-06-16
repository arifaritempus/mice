const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/quotes/page.tsx', 'utf8');

// Replace table wrapper class
content = content.replace(
  /<div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-0">/g,
  '<div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 w-full min-w-0 flex-1 flex flex-col min-h-[300px]">'
);

fs.writeFileSync('frontend/src/app/quotes/page.tsx', content);
console.log('Quotes table patched.');
