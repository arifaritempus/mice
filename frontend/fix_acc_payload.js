const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldBlock = `        if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) {
          const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "";
          let hId = projectHotels.find(h => h.name.toLowerCase() === hStr.toLowerCase())?.id;
          if (!hId && hStr) {
             const mObj = mappingDict[\`Otel:\${hStr}\`];
             if (mObj) hId = mObj;
          }
          
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: catKonaklama,
            sub_category: findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi") || null,
            description: row.konaklama_otel || "Konaklama",
            hotel_id: hId || null,
            reference: (row.konaklama_checkin) + (row.konaklama_checkout ? " - " + row.konaklama_checkout : ""),
            unit_price: row.konaklama_ucreti || 0,
            unit_quantity: 1,
            total_price: row.konaklama_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });

          // Otomatik Blokaj / Odalama tablosu kaydı
          let cIn = row.konaklama_checkin || "";
          let cOut = row.konaklama_checkout || "";
          
          let nights = 0;
          if (cIn && cOut) {
              const dIn = new Date(cIn); // cIn is already YYYY-MM-DD from parseDate
              const dOut = new Date(cOut);
              if (!isNaN(dIn.getTime()) && !isNaN(dOut.getTime())) {
                  const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
                  nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
          }`;

const newBlock = `        if (row.konaklama_ucreti || row.konaklama_otel || row.konaklama_oda) {
          const hStr = row.konaklama_otel ? row.konaklama_otel.trim() : "";
          let hId = projectHotels.find(h => h.name.toLowerCase() === hStr.toLowerCase())?.id;
          if (!hId && hStr) {
             const mObj = mappingDict[\`Otel:\${hStr}\`];
             if (mObj) hId = mObj;
          }

          let cIn = row.konaklama_checkin || "";
          let cOut = row.konaklama_checkout || "";
          
          let nights = 0;
          if (cIn && cOut) {
              const dIn = new Date(cIn);
              const dOut = new Date(cOut);
              if (!isNaN(dIn.getTime()) && !isNaN(dOut.getTime())) {
                  const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
                  nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
          }
          
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: catKonaklama,
            sub_category: findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi") || null,
            description: row.konaklama_otel || "Konaklama",
            hotel_id: hId || null,
            reference: cIn,
            reference_code: cOut,
            voucher_no: row.konaklama_oda_no || "",
            unit_price: row.konaklama_ucreti || 0,
            unit_quantity: 1,
            total_price: row.konaklama_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Moved dates up and mapped modal fields!");
