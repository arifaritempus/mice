const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const tGidis = `                  direction: "arrival",`;
const tGidisNew = `                  hotel_id: hId || null,
                  direction: "arrival",`;

const tDonus = `                  direction: "departure",`;
const tDonusNew = `                  hotel_id: hId || null,
                  direction: "departure",`;

code = code.replace(tGidis, tGidisNew);
code = code.replace(tDonus, tDonusNew);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed transfer hotel!");
