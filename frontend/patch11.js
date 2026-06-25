const fs = require('fs');

let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

pageContent = pageContent.replace(
  /const projFlightRev = data\.salesItems\.filter\(\(si: any\) => inRange\(si\.created_at, range\) && \(ucakKategoriIds\.includes\(si\.category\) \|\| ucakKategoriIds\.includes\(si\.sub_category\)\)\)/g,
  `const projFlightRev = data.salesItems.filter((si: any) => projectIdsInRange.includes(si.project_id) && (ucakKategoriIds.includes(si.category) || ucakKategoriIds.includes(si.sub_category)))`
);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("projFlightRev filter fixed");
