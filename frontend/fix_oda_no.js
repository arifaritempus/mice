const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/konaklama_oda_no: row\["oda no"\] \|\| row\["oda numarası"\] \|\| "",/g, 'konaklama_oda_no: row["oda no"] || row["oda numarası"] || row["oda numarasi"] || row["odano"] || row["oda_no"] || "",');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed oda no variations");
