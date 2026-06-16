const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/globals.css', 'utf8');

// Replace the strict width media query with a touch-based media query
content = content.replace(
  /@media \(max-width: 639px\)/g,
  '@media (hover: none) and (pointer: coarse) and (max-width: 1024px)'
);

content = content.replace(
  /@media \(max-width: 767px\)/g,
  '@media (hover: none) and (pointer: coarse) and (max-width: 1024px)'
);

fs.writeFileSync('frontend/src/app/globals.css', content);
console.log("Fixed globals.css media query");
