const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const oldAccPayload = `          servicesPayload.push({
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
          let cOut = row.konaklama_checkout || "";`;

const newAccPayload = `          // Otomatik Blokaj / Odalama tablosu kaydı
          let cIn = row.konaklama_checkin || "";
          let cOut = row.konaklama_checkout || "";

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

code = code.replace(oldAccPayload, newAccPayload);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed acc reference fields");
