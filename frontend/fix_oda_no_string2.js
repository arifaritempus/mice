const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/konaklama_oda_no: odaNoIdx !== -1 \? row\[odaNoIdx\] : "",/g, 'konaklama_oda_no: odaNoIdx !== -1 && row[odaNoIdx] != null ? String(row[odaNoIdx]) : "",');
code = code.replace(/konaklama_oda_no: row\["oda no"\] \|\| row\["oda numarası"\] \|\| row\["oda numarasi"\] \|\| row\["odano"\] \|\| row\["oda_no"\] \|\| "",/g, 'konaklama_oda_no: String(row["oda no"] || row["oda numarası"] || row["oda numarasi"] || row["odano"] || row["oda_no"] || ""),');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Forced string cast 2");
