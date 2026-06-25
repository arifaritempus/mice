const fs = require('fs');
let pageContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const miceRevRegex = /const miceRev = fProj\.reduce\([\s\S]*?0,\n\s*\);/;

const newMiceRev = `const projectIdsInRange = fProj.map((p: any) => p.project_id);
    const miceRev = data.salesItems.filter((s: any) => projectIdsInRange.includes(s.project_id)).reduce((acc: number, s: any) => acc + (s.total_try || s.total_amount || 0), 0);`;

pageContent = pageContent.replace(miceRevRegex, newMiceRev);

fs.writeFileSync('src/app/dashboard/page.tsx', pageContent);
console.log("miceRev fixed");
