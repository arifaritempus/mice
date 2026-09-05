const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// Fix 1: project_hotels -> hotels
code = code.replace(/await supabase\.from\('project_hotels'\)/g, "await supabase.from('hotels')");

// Fix 2: tc_passport_no -> tc_passport
code = code.replace(/tc_passport_no: row\.tc_passport_no \|\| row\.tc_passport,/g, "tc_passport: row.tc_passport_no || row.tc_passport,");

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed!");
