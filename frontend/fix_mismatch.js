const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldCheck = `if ((row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) && !projectHotels.find(h => h.name.toLowerCase() === (row.konaklama_otel || "").trim().toLowerCase())) addMismatch("Otel", row.konaklama_otel);`;
const newCheck = `if ((row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) && !projectHotels.find(h => h.name.toLowerCase() === (row.konaklama_otel || "").trim().toLowerCase())) addMismatch("Otel", row.konaklama_otel || "(Boş Bırakılmış)");`;
code = code.replace(oldCheck, newCheck);

const oldVar = `const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "";`;
const newVar = `const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "(Boş Bırakılmış)";`;
code = code.replace(oldVar, newVar);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed mismatch hotel");
