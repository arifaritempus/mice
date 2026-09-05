const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// FIX ACC
const oldAcc = `          accommodationsToInsert.push({
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

const newAcc = `          accommodationsToInsert.push({
            project_id: projectId,
            participant_id: p.id,
            hotel_id: hId || null,
            first_name: p.first_name,
            last_name: p.last_name,
            room_type: row.konaklama_oda || "",
            room_number: row.konaklama_oda_no || "",
            nights: nights,
            check_in_date: cIn,
            check_out_date: cOut,
            package: row.konaklama_oda || "", 
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

code = code.replace(oldAcc, newAcc);


// FIX TR GIDIS
const oldTrGidis = `                transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-gidis\`,
                  project_id: projectId,
                  transfer_tarihi: row.transfer_gidis || null,
                  transfer_saati: row.transfer_gidis_saati || null,
                  is_group: row.transfer_arac_tipi?.toLowerCase().includes("grup") ? true : false,
                  transfer_tipi: findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
                  guzergah: row.transfer_guzergah || null,
                  arac_tipi: row.transfer_arac_tipi || null,
                  tedarikci: findSupplier(row.transfer_tedarikci) || null,
                  kisi_sayisi: 1,
                  doviz: "EUR",
                  misafirler: \`\${p.first_name} \${p.last_name}\`
                });`;

const newTrGidis = `                transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-gidis\`,
                  project_id: projectId,
                  participant_id: p.id,
                  direction: "arrival",
                  type_label: row.transfer_arac_tipi?.toLowerCase().includes("grup") ? "Grup" : "Özel",
                  transfer_type: findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
                  route: row.transfer_guzergah || null,
                  vehicle_type: row.transfer_arac_tipi || null,
                  flight_code: row.ucus_gidis_kodu || null,
                  supplier_name: findSupplier(row.transfer_tedarikci) || null,
                  date: row.transfer_gidis || null,
                  time: row.transfer_gidis_saati || null,
                  passengers: [\`\${p.first_name} \${p.last_name}\`]
                });`;

code = code.replace(oldTrGidis, newTrGidis);


// FIX TR DONUS
const oldTrDonus = `                transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-donus\`,
                  project_id: projectId,
                  transfer_tarihi: row.transfer_donus || null,
                  transfer_saati: row.transfer_donus_saati || null,
                  is_group: row.donus_transfer_arac_tipi?.toLowerCase().includes("grup") ? true : false,
                  transfer_tipi: findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
                  guzergah: row.donus_transfer_guzergah || null,
                  arac_tipi: row.donus_transfer_arac_tipi || null,
                  tedarikci: findSupplier(row.donus_transfer_tedarikci) || null,
                  kisi_sayisi: 1,
                  doviz: "EUR",
                  misafirler: \`\${p.first_name} \${p.last_name}\`
                });`;

const newTrDonus = `                transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-donus\`,
                  project_id: projectId,
                  participant_id: p.id,
                  direction: "departure",
                  type_label: row.donus_transfer_arac_tipi?.toLowerCase().includes("grup") ? "Grup" : "Özel",
                  transfer_type: findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
                  route: row.donus_transfer_guzergah || null,
                  vehicle_type: row.donus_transfer_arac_tipi || null,
                  flight_code: row.ucus_donus_kodu || null,
                  supplier_name: findSupplier(row.donus_transfer_tedarikci) || null,
                  date: row.transfer_donus || null,
                  time: row.transfer_donus_saati || null,
                  passengers: [\`\${p.first_name} \${p.last_name}\`]
                });`;

code = code.replace(oldTrDonus, newTrDonus);

// Remove flight from transfers! Flights STILL HAVE DONUS TARIHI bug? No, flights succeeded! 
// "Flight Error: null" means flights schema is fully correct!

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Reverted transfer and acc to English schema!");
