const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const lastLines = code.substring(code.indexOf('3. Adım: Toplu Sponsor / Kota Seçimi'));
console.log(lastLines);
