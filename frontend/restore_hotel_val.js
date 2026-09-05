const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Add hotel mismatch check back
const loopStartStr = 'const r = formattedData[i];';
const newLoopStartStr = `const r = formattedData[i];
          
          const hasHotelData = r.konaklama_oda || r.konaklama_checkin || r.konaklama_ucreti || r.konaklama_otel;
          if (hasHotelData) {
            const hotelStr = r.konaklama_otel?.trim().toLowerCase() || "";
            // projectHotels array has objects {id, name}
            const matched = projectHotels.find(h => {
              const hn = h.name.toLowerCase();
              return hn === hotelStr || hn.includes(hotelStr) || (hotelStr && hotelStr.includes(hn));
            });
            if (!matched) {
              addMismatch("otel", r.konaklama_otel || "Otel Seçilmedi", r);
            }
          }
`;
code = code.replace(loopStartStr, newLoopStartStr);

// 2. Fix applyMappings for hotel
const applyHotelStr = `konaklama_otel: applyMap(r.konaklama_otel, "otel"),`;
const newApplyHotelStr = `konaklama_otel: applyMap(r.konaklama_otel || "Otel Seçilmedi", "otel"),`;
code = code.replace(applyHotelStr, newApplyHotelStr);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed hotel validation logic!");
