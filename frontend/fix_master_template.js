const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const targetStr = `          // Master Template Mode
          const dataRows = dataRaw.slice(2);
          formattedData = dataRows.map((row: any) => {`;
          
const newStr = `          // Master Template Mode
          const dataRows = dataRaw.slice(2);
          const masterHeaders = (dataRaw[1] || []).map((h: any) => h ? h.toString().toLowerCase().trim().replace(/\\s+/g, ' ') : "");
          
          const odaNoIdx = masterHeaders.findIndex(h => h === "oda no" || h === "oda numarası" || h === "oda numarasi" || h === "odano" || h === "oda_no" || h === "room no");
          const unvanIdx = masterHeaders.findIndex(h => h === "unvan" || h === "title");

          formattedData = dataRows.map((row: any) => {`;

code = code.replace(targetStr, newStr);

const targetRow = `              title: "", // Not in template
              first_name: row[1], 
              last_name: row[2], 
              tc_passport: row[6], 
              email: row[5], 
              phone: row[4], 
              registration_type: row[3] || "Delege", // Use Kayıt Tipi for Registration Type
              notes: row[7], 
              
              kayit_adi: row[3], 
              kayit_ucreti: parseFloat(row[34]) || 0, 
              
              konaklama_otel: row[8], 
              konaklama_checkin: parseDate(row[9]), 
              konaklama_checkout: parseDate(row[10]), 
              konaklama_oda: row[11], 
              konaklama_oda_no: "", // They want Room No but it's not in template columns
              konaklama_ucreti: parseFloat(row[35]) || 0, `;

const newRow = `              title: unvanIdx !== -1 ? row[unvanIdx] : "",
              first_name: row[1], 
              last_name: row[2], 
              tc_passport: row[6], 
              email: row[5], 
              phone: row[4], 
              registration_type: row[3] || "Delege", // Use Kayıt Tipi for Registration Type
              notes: row[7], 
              
              kayit_adi: row[3], 
              kayit_ucreti: parseFloat(row[34]) || 0, 
              
              konaklama_otel: row[8], 
              konaklama_checkin: parseDate(row[9]), 
              konaklama_checkout: parseDate(row[10]), 
              konaklama_oda: row[11], 
              konaklama_oda_no: odaNoIdx !== -1 ? row[odaNoIdx] : "", 
              konaklama_ucreti: parseFloat(row[35]) || 0, `;

code = code.replace(targetRow, newRow);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed master template indices");
