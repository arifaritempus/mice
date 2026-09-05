const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// Replace flight IDs
code = code.replace(/id: \`flight-\${p\.id}-gidis\`,\n/g, '');
code = code.replace(/id: \`flight-\${p\.id}-donus\`,\n/g, '');

// Replace transfer IDs
code = code.replace(/id: \`transfer-\${p\.id}-gidis\`,\n/g, '');
code = code.replace(/id: \`transfer-\${p\.id}-donus\`,\n/g, '');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Removed hardcoded string IDs!");
