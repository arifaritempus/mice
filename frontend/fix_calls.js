const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/setTempFormattedData\(\[\]\);/g, '');
code = code.replace(/setMismatches\(\[\]\);/g, '');
code = code.replace(/setShowMappingWizard\(false\);/g, '');

code = code.replace(/setMismatches\(newMismatches\);/g, '');
code = code.replace(/setTempFormattedData\(formattedData\);/g, '');
code = code.replace(/setShowMappingWizard\(true\);/g, '');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed calls!");
