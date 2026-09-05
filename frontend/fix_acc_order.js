const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

const targetLoop = `        // Yeni kalemleri ekle veya güncelle
        for (const item of items) {`;

const newLoop = `        // Yeni kalemleri ekle veya güncelle
        const baseTime = Date.now();
        for (let i = 0; i < items.length; i++) {
          const item = items[i];`;

const targetPayload = `            return_flight_arrival: item.donus_ucak_inis || "",
          };`;

const newPayload = `            return_flight_arrival: item.donus_ucak_inis || "",
            created_at: new Date(baseTime + (i * 1000)).toISOString(),
          };`;

if (code.includes(targetLoop) && code.includes(targetPayload)) {
    code = code.replace(targetLoop, newLoop);
    code = code.replace(targetPayload, newPayload);
    fs.writeFileSync('src/app/projects/[id]/page.tsx', code);
    console.log("Fixed saveAccommodationItems order");
} else {
    console.log("Could not find targets in page.tsx");
}
