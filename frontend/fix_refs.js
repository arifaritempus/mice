const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// Remove states
code = code.replace(/const \[mismatches, setMismatches\] = useState<any\[\]>\(\[\]\);\n/g, '');
code = code.replace(/const \[showMappingWizard, setShowMappingWizard\] = useState\(false\);\n/g, '');
code = code.replace(/const \[tempFormattedData, setTempFormattedData\] = useState<any\[\]>\(\[\]\);\n/g, '');

// Remove disabled condition
code = code.replace(/disabled=\{loading \|\| parsedData\.length === 0 \|\| showMappingWizard\}/g, 'disabled={loading || parsedData.length === 0}');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed refs!");
