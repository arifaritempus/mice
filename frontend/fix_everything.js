const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// 1. Fix the Select in insertedItems
const oldSelect = `const { data: insertedItems, error: srvError } = await supabase.from('project_sales_items').insert(itemsToInsert).select('id, category, description, reference');`;
const newSelect = `const { data: insertedItems, error: srvError } = await supabase.from('project_sales_items').insert(itemsToInsert).select('id, category, description, reference, participant_id');`;
code = code.replace(oldSelect, newSelect);

// 2. Fix the Sales Item fields for Accommodation
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
          });`;
const newAccPayload = `          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: catKonaklama,
            sub_category: findSubCat([row.konaklama_oda, row.konaklama_otel], catKonaklama, "Oda Tipi") || null,
            description: row.konaklama_otel || "Konaklama",
            hotel_id: hId || null,
            reference: cIn || "",           // Check-in (mapped to reference in modal)
            reference_code: cOut || "",     // Check-out (mapped to reference_code in modal)
            voucher_no: row.konaklama_oda_no || "", // Oda No (mapped to voucher_no in modal)
            unit_price: row.konaklama_ucreti || 0,
            unit_quantity: 1,
            total_price: row.konaklama_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });`;

// Wait, cIn and cOut are defined AFTER this push! I need to move them UP!
