const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldCheck = `const matched = projectHotels.find(h => {
              const hn = h.name.toLowerCase();
              return hn === hotelStr || hn.includes(hotelStr) || (hotelStr && hotelStr.includes(hn));
            });`;
const newCheck = `const matched = projectHotels.find(h => {
              const hn = h.name.toLowerCase();
              if (!hotelStr) return false;
              return hn === hotelStr || hn.includes(hotelStr) || (hotelStr && hotelStr.includes(hn));
            });`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed includes('') bug!");
