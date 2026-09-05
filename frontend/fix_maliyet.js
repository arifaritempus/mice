const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/toplam_satis: ucusFiyat \|\| 0/g, 'toplam_maliyet: 0,\n                  toplam_satis: ucusFiyat || 0');
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Added toplam_maliyet");
