const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const mismatchStr = 'if (r.transfer_tipi && !transferCatsLower.includes(r.transfer_tipi.toLowerCase())) addMismatch("transfer", r.transfer_tipi, r);';
const newMismatchStr = `if (r.transfer_tipi && !transferCatsLower.includes(r.transfer_tipi.toLowerCase())) addMismatch("transfer", r.transfer_tipi, r);
          if (r.donus_transfer_tipi && !transferCatsLower.includes(r.donus_transfer_tipi.toLowerCase())) addMismatch("transfer", r.donus_transfer_tipi, r);`;

code = code.replace(mismatchStr, newMismatchStr);

const applyStartStr = 'if (m.type === "transfer" && (r.transfer_tipi || "").toLowerCase() === m.invalidValue.toLowerCase()) r.transfer_tipi = m.mappedValue;';
const newApplyStr = `if (m.type === "transfer" && (r.transfer_tipi || "").toLowerCase() === m.invalidValue.toLowerCase()) r.transfer_tipi = m.mappedValue;
          if (m.type === "transfer" && (r.donus_transfer_tipi || "").toLowerCase() === m.invalidValue.toLowerCase()) r.donus_transfer_tipi = m.mappedValue;`;

code = code.replace(applyStartStr, newApplyStr);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Success updated donus transfer checks");
