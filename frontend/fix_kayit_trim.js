const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldKayit = 'const matchedKayit = categories.find(c => c.name.toLowerCase() === row.kayit_adi?.toLowerCase());';
const newKayit = 'const matchedKayit = categories.find(c => c.name.toLowerCase().trim() === row.kayit_adi?.trim().toLowerCase());';
code = code.replace(oldKayit, newKayit);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success kayit trim!");
