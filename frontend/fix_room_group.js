const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressRoomingTab.tsx', 'utf8');

const targetGrouping = `        withHotels.forEach(p => {
          if (p.voucher_no) {
            const companyName = p.company?.name || "Bireysel";
            const roomKey = companyName + "_" + p.voucher_no;`;
            
const newGrouping = `        withHotels.forEach(p => {
          if (p.voucher_no) {
            const companyName = p.company?.name || "Bireysel";
            // Gruplama mantığını Şirkete göre DEĞİL, Otele ve Oda Numarasına göre yapıyoruz!
            const roomKey = (p.hotel_id || "belirsiz_otel") + "_" + p.voucher_no;`;

code = code.replace(targetGrouping, newGrouping);
fs.writeFileSync('src/app/projects/[id]/CongressRoomingTab.tsx', code);
console.log("Fixed room grouping");
