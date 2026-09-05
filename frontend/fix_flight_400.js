const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const targetStr = `                  _tempId: \`flight-\${p.id}\`,
                  project_id: projectId,
                  participant_id: p.id,
                  ucus_tipi: row.ucus_tipi || "",`;
                  
const newStr = `                  _tempId: \`flight-\${p.id}\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "",`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Removed participant_id from flight payload");
