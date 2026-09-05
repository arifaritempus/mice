const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// The file currently has:
// flightsToInsert.push({
//                                     project_id: projectId,
//                   flight_type: "Gidiş",

code = code.replace(/flightsToInsert\.push\({\n\s*project_id: projectId,\n\s*flight_type: "Gidiş"/g, 
'flightsToInsert.push({\n                  _tempId: \`flight-\${p.id}-gidis\`,\n                  project_id: projectId,\n                  flight_type: "Gidiş"');

code = code.replace(/flightsToInsert\.push\({\n\s*project_id: projectId,\n\s*flight_type: "Dönüş"/g, 
'flightsToInsert.push({\n                  _tempId: \`flight-\${p.id}-donus\`,\n                  project_id: projectId,\n                  flight_type: "Dönüş"');

code = code.replace(/transfersToInsert\.push\({\n\s*project_id: projectId,\n\s*direction: "Geliş"/g, 
'transfersToInsert.push({\n                  _tempId: \`transfer-\${p.id}-gidis\`,\n                  project_id: projectId,\n                  direction: "Geliş"');

code = code.replace(/transfersToInsert\.push\({\n\s*project_id: projectId,\n\s*direction: "Dönüş"/g, 
'transfersToInsert.push({\n                  _tempId: \`transfer-\${p.id}-donus\`,\n                  project_id: projectId,\n                  direction: "Dönüş"');

// And in the loop:
/*
        if (insertedItems) {
            flightsToInsert.forEach(f => {
                const sIdStr = f.id.replace('-gidis', '').replace('-donus', '');
                const matchedItem = insertedItems.find(it => it.category === catUcak && `flight-${it.participant_id}` === sIdStr);
                if (matchedItem) f.id = matchedItem.id;
            });
*/

const oldMapLoop = `
        if (insertedItems) {
            flightsToInsert.forEach(f => {
                const sIdStr = f.id.replace('-gidis', '').replace('-donus', '');
                const matchedItem = insertedItems.find(it => it.category === catUcak && \`flight-\${it.participant_id}\` === sIdStr);
                if (matchedItem) f.id = matchedItem.id;
            });
            transfersToInsert.forEach(t => {
                const sIdStr = t.id.replace('-gidis', '').replace('-donus', '');
                const matchedItem = insertedItems.find(it => it.category === catTransfer && \`transfer-\${it.participant_id}\` === sIdStr);
                if (matchedItem) t.id = matchedItem.id;
            });
        }`;

const newMapLoop = `
        if (insertedItems) {
            flightsToInsert.forEach(f => {
                if (f._tempId) {
                    const sIdStr = f._tempId.replace('-gidis', '').replace('-donus', '');
                    const matchedItem = insertedItems.find(it => it.category === catUcak && \`flight-\${it.participant_id}\` === sIdStr);
                    if (matchedItem) f.id = matchedItem.id;
                    delete f._tempId;
                }
            });
            transfersToInsert.forEach(t => {
                if (t._tempId) {
                    const sIdStr = t._tempId.replace('-gidis', '').replace('-donus', '');
                    const matchedItem = insertedItems.find(it => it.category === catTransfer && \`transfer-\${it.participant_id}\` === sIdStr);
                    if (matchedItem) t.id = matchedItem.id;
                    delete t._tempId;
                }
            });
        }`;

if (code.includes('f.id.replace(')) {
    code = code.replace(oldMapLoop, newMapLoop);
}

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed temp IDs!");
