const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

pageContent = pageContent.replace(
  /const totalRev = miceRev \+ sejRev \+ flightRev \+ eventRev;/g,
  `const totalRev = miceRev + sejRev + eventRev; // flightRev is already included in miceRev and sejRev!`
);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("totalRev fixed");
