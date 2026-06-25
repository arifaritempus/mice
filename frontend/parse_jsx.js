const fs = require('fs');
let fileContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const returnIndex = fileContent.indexOf('return (');
const jsxBody = fileContent.substring(returnIndex);
fs.writeFileSync('dashboard_jsx.txt', jsxBody);
console.log("JSX extracted");
