const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

code = code.replace(/setImportErrors\(errors\);\s*return;/, 'setImportErrors(errors);\n          toast.error("Excel dosyanızda eşleşmeyen veriler var, lütfen hataları düzeltin!");\n          return;');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Toast added!");
