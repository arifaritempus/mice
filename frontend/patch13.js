const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

pageContent = pageContent.replace(
  /const start = new Date\(range\.start\);\n\s*const end = new Date\(range\.end\);/,
  `const displayRange = getPeriodRange(period, customDate.start, customDate.end);
                      const start = new Date(displayRange.start);
                      const end = new Date(displayRange.end);`
);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("range reference fixed");
