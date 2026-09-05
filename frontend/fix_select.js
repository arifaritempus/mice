const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldSelect = `await supabase.from('project_sales_items').insert(itemsToInsert).select('id, category, description, reference');`;
const newSelect = `await supabase.from('project_sales_items').insert(itemsToInsert).select('id, category, description, reference, participant_id');`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed select participant_id!");
