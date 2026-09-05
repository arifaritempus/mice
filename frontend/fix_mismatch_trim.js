const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const m1 = 'if (r.kayit_adi && !kayitCatsLower.includes(r.kayit_adi.toLowerCase())) addMismatch("kayit", r.kayit_adi, r);';
const m1New = 'if (r.kayit_adi && !kayitCatsLower.includes(r.kayit_adi.trim().toLowerCase())) addMismatch("kayit", r.kayit_adi.trim(), r);';

const m2 = 'if (r.konaklama_oda && !konaklamaCatsLower.includes(r.konaklama_oda.toLowerCase())) addMismatch("konaklama", r.konaklama_oda, r);';
const m2New = 'if (r.konaklama_oda && !konaklamaCatsLower.includes(r.konaklama_oda.trim().toLowerCase())) addMismatch("konaklama", r.konaklama_oda.trim(), r);';

const m3 = 'if (r.transfer_tipi && !transferCatsLower.includes(r.transfer_tipi.toLowerCase())) addMismatch("transfer", r.transfer_tipi, r);';
const m3New = 'if (r.transfer_tipi && !transferCatsLower.includes(r.transfer_tipi.trim().toLowerCase())) addMismatch("transfer", r.transfer_tipi.trim(), r);';

const m4 = 'if (r.donus_transfer_tipi && !transferCatsLower.includes(r.donus_transfer_tipi.toLowerCase())) addMismatch("transfer", r.donus_transfer_tipi, r);';
const m4New = 'if (r.donus_transfer_tipi && !transferCatsLower.includes(r.donus_transfer_tipi.trim().toLowerCase())) addMismatch("transfer", r.donus_transfer_tipi.trim(), r);';

code = code.replace(m1, m1New);
code = code.replace(m2, m2New);
code = code.replace(m3, m3New);
code = code.replace(m4, m4New);

const applyMapOld = `const match = mismatches.find(m => m.type === type && m.invalidValue.toLowerCase() === val.toLowerCase());`;
const applyMapNew = `const match = mismatches.find(m => m.type === type && m.invalidValue.trim().toLowerCase() === val.trim().toLowerCase());`;

code = code.replace(applyMapOld, applyMapNew);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success trimmed mismatches!");
