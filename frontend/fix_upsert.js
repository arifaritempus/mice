const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldFlight = `if (flightsToInsert.length > 0) { const {error} = await supabase.from('project_flight_tickets').insert(flightsToInsert); if(error) console.error("FLIGHT INSERT ERROR:", error); }`;
const newFlight = `if (flightsToInsert.length > 0) { const {error} = await supabase.from('project_flight_tickets').upsert(flightsToInsert); if(error) console.error("FLIGHT INSERT ERROR:", error); }`;

const oldTransfer = `if (transfersToInsert.length > 0) { const {error} = await supabase.from('project_transfer_tour').insert(transfersToInsert); if(error) console.error("TRANSFER INSERT ERROR:", error); }`;
const newTransfer = `if (transfersToInsert.length > 0) { const {error} = await supabase.from('project_transfer_tour').upsert(transfersToInsert); if(error) console.error("TRANSFER INSERT ERROR:", error); }`;

code = code.replace(oldFlight, newFlight);
code = code.replace(oldTransfer, newTransfer);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed to upsert!");
