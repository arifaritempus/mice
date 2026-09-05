const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/ucus_tipi: row.ucus_tipi \|\| "İç Hat",/g, 'ucus_tipi: row.ucus_tipi || "",');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Removed Ic Hat again");
