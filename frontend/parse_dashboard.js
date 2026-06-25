const fs = require('fs');
let fileContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const start = fileContent.indexOf('const m = useMemo(() => {');
const end = fileContent.indexOf('return {', start);
const body = fileContent.substring(start, end);
fs.writeFileSync('dashboard_memo.txt', body);
console.log("Done");
