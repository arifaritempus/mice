const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', 'utf8');

const oldFlightMerge = `return { ...item, ...op };`;
const newFlightMerge = `return { ...op, ...item };`;
code = code.replace(oldFlightMerge, newFlightMerge);

const oldTransferMerge = `return { ...item, ...op };`;
const newTransferMerge = `return { ...op, ...item };`;
code = code.replace(oldTransferMerge, newTransferMerge);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantModal.tsx', code);
console.log("Fixed merge order!");
