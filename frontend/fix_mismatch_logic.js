const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldCheck = `          if (row.konaklama_otel) {
            const hStr = row.konaklama_otel.trim();
            if (!mappingDict[\`Otel:\${hStr}\`]) {
              const hLow = hStr.toLowerCase();
              const hMatch = projectHotels.find(h => h.name.toLowerCase() === hLow) || projectHotels.find(h => h.name.toLowerCase().includes(hLow) || hLow.includes(h.name.toLowerCase()));
              if (!hMatch) addMismatch("Otel", hStr);
            }
          }`;
          
const newCheck = `          if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda || row.konaklama_checkin || row.konaklama_checkout) {
            const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "(Boş Bırakılmış)";
            if (!mappingDict[\`Otel:\${hStr}\`]) {
              const hLow = hStr.toLowerCase();
              const hMatch = hStr === "(Boş Bırakılmış)" ? null : (projectHotels.find(h => h.name.toLowerCase() === hLow) || projectHotels.find(h => h.name.toLowerCase().includes(hLow) || hLow.includes(h.name.toLowerCase())));
              if (!hMatch) addMismatch("Otel", hStr);
            }
          }`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed mismatch logic");
