const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldMismatch = 'if (r.konaklama_otel && !hotelNamesLower.includes(r.konaklama_otel.toLowerCase())) addMismatch("otel", r.konaklama_otel, r);';
const newMismatch = 'if (r.konaklama_otel && !hotelNamesLower.some(h => h === r.konaklama_otel.trim().toLowerCase() || h.includes(r.konaklama_otel.trim().toLowerCase()) || r.konaklama_otel.trim().toLowerCase().includes(h))) addMismatch("otel", r.konaklama_otel, r);';

code = code.replace(oldMismatch, newMismatch);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success hotel mismatch updated!");
