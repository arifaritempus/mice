const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/voucher_no: row\.konaklama_oda_no \|\| "",/g, 'voucher_no: row.konaklama_oda_no ? String(row.konaklama_oda_no) : "",');
code = code.replace(/room_number: row\.konaklama_oda_no \|\| "",/g, 'room_number: row.konaklama_oda_no ? String(row.konaklama_oda_no) : "",');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Forced string cast for Oda No");
