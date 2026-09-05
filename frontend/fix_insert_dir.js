const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldTransferStr = `transfersToInsert.push({
                id: sale.id,
                project_id: projectId,
                transfer_type: sale.sub_category || null,`;

const newTransferStr = `transfersToInsert.push({
                id: sale.id,
                project_id: projectId,
                direction: isGelis ? "arrival" : "departure",
                type_label: isGelis ? "Giriş" : "Çıkış",
                transfer_type: sale.sub_category || null,`;

code = code.replace(oldTransferStr, newTransferStr);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success transfer direction updated!");
