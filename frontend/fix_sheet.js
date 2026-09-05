const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldStr = `const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];`;

const newStr = `const wsname = wb.SheetNames.find(s => s.toLowerCase().includes('rooming')) || wb.SheetNames.find(s => s !== 'Kategoriler') || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];`;

code = code.replace(oldStr, newStr);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Sheet name fix applied!");
