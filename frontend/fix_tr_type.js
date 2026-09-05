const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const tGidis = `transfer_type: findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,`;
const tGidisNew = `transfer_type: row.transfer_arac_tipi || null,`;

const tDonus = `transfer_type: findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,`;
const tDonusNew = `transfer_type: row.donus_transfer_arac_tipi || null,`;

code = code.replace(tGidis, tGidisNew);
code = code.replace(tDonus, tDonusNew);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed transfer_type to be string");
