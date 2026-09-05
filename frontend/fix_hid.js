const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldStart = `      insertedParticipants.forEach((p, idx) => {
        const row = parsedData[idx];
        
        if (row.kayit_ucreti || row.kayit_adi) {`;

const newStart = `      insertedParticipants.forEach((p, idx) => {
        const row = parsedData[idx];
        
        // Ortak hId tanımı
        const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "";
        let hId = projectHotels.find(h => h.name.toLowerCase() === hStr.toLowerCase())?.id;
        if (!hId && hStr) {
           const mObj = mappingDict[\`Otel:\${hStr}\`];
           if (mObj) hId = mObj;
        }

        if (row.kayit_ucreti || row.kayit_adi) {`;

code = code.replace(oldStart, newStart);

const oldHidBlock = `        if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) {
          const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "(Boş Bırakılmış)";
          let hId = projectHotels.find(h => h.name.toLowerCase() === hStr.toLowerCase())?.id;
          if (!hId && hStr) {
             const mObj = mappingDict[\`Otel:\${hStr}\`];
             if (mObj) hId = mObj;
          }

          let cIn = row.konaklama_checkin || "";`;

const newHidBlock = `        if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) {
          let cIn = row.konaklama_checkin || "";`;

code = code.replace(oldHidBlock, newHidBlock);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed hId scope!");
