const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldStr = 'const matchedHotel = projectHotels.find(h => h.name.toLowerCase().includes(row.konaklama_otel?.toLowerCase() || "xxxxx"));';
const newStr = 'const matchedHotel = projectHotels.find(h => h.name.toLowerCase().includes(row.konaklama_otel?.trim().toLowerCase() || "xxxxx") || (row.konaklama_otel && row.konaklama_otel.toLowerCase().includes(h.name.toLowerCase())));';

code = code.replace(oldStr, newStr);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success hotel match updated!");
