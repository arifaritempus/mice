const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const tDec = `      const flightsToInsert: any[] = [];
      const transfersToInsert: any[] = [];
      const servicesPayload: any[] = [];`;

const tDecNew = `      const flightsToInsert: any[] = [];
      const transfersToInsert: any[] = [];
      const servicesPayload: any[] = [];
      const accommodationsToInsert: any[] = [];`;

code = code.replace(tDec, tDecNew);

const accPayloadOld = `          servicesPayload.push({
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

const accPayloadNew = `          servicesPayload.push({
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
              const dIn = new Date(cIn.split('.').reverse().join('-'));
              const dOut = new Date(cOut.split('.').reverse().join('-'));
              if (!isNaN(dIn.getTime()) && !isNaN(dOut.getTime())) {
                  const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
                  nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }
          }

          accommodationsToInsert.push({
            project_id: projectId,
            hotel_id: hId || null,
            person_name: \`\${p.first_name} \${p.last_name}\`,
            room_type: row.konaklama_oda || "",
            accommodation_type: row.konaklama_oda || "", // or findSubCat ...
            room_number: row.konaklama_oda_no || "",
            nights: nights,
            check_in: cIn,
            check_out: cOut,
            transfer: row.transfer_guzergah || row.donus_transfer_guzergah || "",
            flight: row.ucus_parkuru || row.donus_ucus_parkuru || "",
            total: row.konaklama_ucreti || 0,
            currency: currency,
            room_note: row.notes || "",
            arrival_flight_code: row.ucus_gidis_kodu || "",
            arrival_flight_departure: row.ucus_gidis_saati || "",
            arrival_flight_arrival: "",
            return_flight_code: row.ucus_donus_kodu || "",
            return_flight_departure: row.ucus_donus_saati || "",
            return_flight_arrival: "",
          });`;

code = code.replace(accPayloadOld, accPayloadNew);

const insertOld = `      if (flightsToInsert.length > 0) { const {error} = await supabase.from('project_flight_tickets').insert(flightsToInsert); if(error) console.error("FLIGHT INSERT ERROR:", error); }
      if (transfersToInsert.length > 0) { const {error} = await supabase.from('project_transfer_tour').insert(transfersToInsert); if(error) console.error("TRANSFER INSERT ERROR:", error); }`;

const insertNew = `      if (flightsToInsert.length > 0) { const {error} = await supabase.from('project_flight_tickets').insert(flightsToInsert); if(error) console.error("FLIGHT INSERT ERROR:", error); }
      if (transfersToInsert.length > 0) { const {error} = await supabase.from('project_transfer_tour').insert(transfersToInsert); if(error) console.error("TRANSFER INSERT ERROR:", error); }
      if (accommodationsToInsert.length > 0) { const {error} = await supabase.from('project_accommodation_items').insert(accommodationsToInsert); if(error) console.error("ACCOMMODATION INSERT ERROR:", error); }`;

code = code.replace(insertOld, insertNew);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Added accommodationsToInsert!");
