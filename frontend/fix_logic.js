const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// UÇAK FIX:
const oldUcakBlock = `            if (row.ucus_parkuru) {
                flightsToInsert.push({
                  _tempId: \`flight-\${p.id}-gidis\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "İç Hat",
                  pnr: row.ucus_pnr || null,
                  havayolu: row.havayolu || null,
                  gidis_tarihi: row.ucus_gidis || null,
                  gidis_saati: row.ucus_gidis_saati || null,
                  gidis_ucus_kodu: row.ucus_gidis_kodu || null,
                  donus_tarihi: null,
                  donus_saati: null,
                  donus_ucus_kodu: null,
                  guzergah: row.ucus_parkuru || null,
                  tedarikci: findSupplier(row.ucus_tedarikci) || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });
            }
            if (row.donus_ucus_parkuru) {
                flightsToInsert.push({
                  _tempId: \`flight-\${p.id}-donus\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "İç Hat",
                  pnr: row.donus_ucus_pnr || null,
                  havayolu: row.donus_havayolu || null,
                  gidis_tarihi: null,
                  gidis_saati: null,
                  gidis_ucus_kodu: null,
                  donus_tarihi: row.ucus_donus || null,
                  donus_saati: row.ucus_donus_saati || null,
                  donus_ucus_kodu: row.ucus_donus_kodu || null,
                  guzergah: row.donus_ucus_parkuru || null,
                  tedarikci: findSupplier(row.donus_ucus_tedarikci) || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });
            }`;

const newUcakBlock = `            // Uçak biletleri veritabanında TEK SATIRDA (Gidiş-Dönüş) tutuluyor.
            if (row.ucus_parkuru || row.donus_ucus_parkuru) {
                flightsToInsert.push({
                  _tempId: \`flight-\${p.id}\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "İç Hat",
                  pnr: row.ucus_pnr || row.donus_ucus_pnr || null,
                  havayolu: row.havayolu || row.donus_havayolu || null,
                  gidis_tarihi: row.ucus_gidis || null,
                  gidis_saati: row.ucus_gidis_saati || null,
                  gidis_ucus_kodu: row.ucus_gidis_kodu || null,
                  donus_tarihi: row.ucus_donus || null,
                  donus_saati: row.ucus_donus_saati || null,
                  donus_ucus_kodu: row.ucus_donus_kodu || null,
                  guzergah: ucusRef || null,
                  tedarikci: findSupplier(row.ucus_tedarikci) || findSupplier(row.donus_ucus_tedarikci) || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });
            }`;
code = code.replace(oldUcakBlock, newUcakBlock);


// TRANSFER FIX:
const oldTrBlock = `        if (row.transfer_ucreti || row.transfer_guzergah || row.donus_transfer_ucreti || row.donus_transfer_guzergah) {
            let trRef = "";
            let trFiyat = 0;
            if (row.transfer_guzergah) {
                trRef += row.transfer_guzergah;
                trFiyat += (row.transfer_ucreti || 0);
            }
            if (row.donus_transfer_guzergah) {
                trRef += (trRef ? " | " : "") + row.donus_transfer_guzergah;
                trFiyat += (row.donus_transfer_ucreti || 0);
            }

            servicesPayload.push({
              project_id: projectId,
              participant_id: p.id,
              category: catTransfer,
              sub_category: findSubCat([row.transfer_arac_tipi, "", row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
              description: "Transfer",
              reference: trRef,
              unit_price: trFiyat,
              unit_quantity: 1,
              total_price: trFiyat,
              currency: currency,
              payer_company_id: selectedCompanyId || null
            });
            
            if (row.transfer_guzergah) {
                transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-gidis\`,
                  project_id: projectId,
                  participant_id: p.id,
                  hotel_id: hId || null,
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
                });
            }
            if (row.donus_transfer_guzergah) {
                transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-donus\`,
                  project_id: projectId,
                  participant_id: p.id,
                  hotel_id: hId || null,
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
                });
            }
        }`;

const newTrBlock = `        // Geliş Transfer
        if (row.transfer_ucreti || row.transfer_guzergah) {
            const tempId = \`transfer-\${p.id}-gidis\`;
            servicesPayload.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              category: catTransfer,
              sub_category: findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
              description: "Transfer",
              reference: row.transfer_guzergah || "",
              reference_code: row.transfer_gidis || "",
              unit_price: row.transfer_ucreti || 0,
              unit_quantity: 1,
              total_price: row.transfer_ucreti || 0,
              currency: currency,
              payer_company_id: selectedCompanyId || null
            });
            transfersToInsert.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              hotel_id: hId || null,
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
            });
        }
        
        // Dönüş Transfer
        if (row.donus_transfer_ucreti || row.donus_transfer_guzergah) {
            const tempId = \`transfer-\${p.id}-donus\`;
            servicesPayload.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              category: catTransfer,
              sub_category: findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
              description: "Transfer",
              reference: row.donus_transfer_guzergah || "",
              reference_code: row.transfer_donus || "",
              unit_price: row.donus_transfer_ucreti || 0,
              unit_quantity: 1,
              total_price: row.donus_transfer_ucreti || 0,
              currency: currency,
              payer_company_id: selectedCompanyId || null
            });
            transfersToInsert.push({
              _tempId: tempId,
              project_id: projectId,
              participant_id: p.id,
              hotel_id: hId || null,
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
            });
        }`;

code = code.replace(oldTrBlock, newTrBlock);

// FIX ID MAPPING LOGIC AT THE END
const oldMapping = `        if (insertedItems) {
            flightsToInsert.forEach(f => {
                if (f._tempId) {
                    const sIdStr = f._tempId.replace('-gidis', '').replace('-donus', '');
                    const matchedItem = insertedItems.find(it => it.category === catUcak && \`flight-\${it.participant_id}\` === sIdStr);
                    if (matchedItem) f.id = matchedItem.id;
                    delete f._tempId;
                }
            });
            transfersToInsert.forEach(t => {
                if (t._tempId) {
                    const sIdStr = t._tempId.replace('-gidis', '').replace('-donus', '');
                    const matchedItem = insertedItems.find(it => it.category === catTransfer && \`transfer-\${it.participant_id}\` === sIdStr);
                    if (matchedItem) t.id = matchedItem.id;
                    delete t._tempId;
                }
            });
        }`;

// We added _tempId directly to servicesPayload! So we can use that to match!
// But wait, when inserting services, the _tempId is dropped! Let's pass it back if possible, 
// or since we have insertedItems, we can map by index if we preserve order, or we can just rely on reference for match? 
// Actually, let's inject _tempId into project_sales_items.reference? No!
// Wait! `itemsToInsert` stripped `_tempId`. 
// BUT `servicesPayload` HAS the original order and `_tempId`!
// And `insertedItems` is returned in the SAME ORDER as `itemsToInsert` (usually), or we can match by `participant_id` and `category` and `reference`.
const newMapping = `        if (insertedItems && insertedItems.length === servicesPayload.length) {
            // Because Supabase returns rows in the exact order of insertion
            insertedItems.forEach((inserted, index) => {
               const original = servicesPayload[index];
               if (original._tempId) {
                   // Uçak
                   if (original.category === catUcak) {
                       const f = flightsToInsert.find(f => f._tempId === original._tempId);
                       if (f) { f.id = inserted.id; delete f._tempId; }
                   }
                   // Transfer
                   if (original.category === catTransfer) {
                       const t = transfersToInsert.find(t => t._tempId === original._tempId);
                       if (t) { t.id = inserted.id; delete t._tempId; }
                   }
               }
            });
            // Hâlâ silinmemiş _tempId varsa temizle
            flightsToInsert.forEach(f => delete f._tempId);
            transfersToInsert.forEach(t => delete t._tempId);
        } else if (insertedItems) {
            // Fallback (eğer sıra karışırsa vb)
            flightsToInsert.forEach(f => {
                if (f._tempId) {
                    const matchedItem = insertedItems.find(it => it.category === catUcak && \`flight-\${it.participant_id}\` === f._tempId);
                    if (matchedItem) f.id = matchedItem.id;
                    delete f._tempId;
                }
            });
            transfersToInsert.forEach(t => {
                if (t._tempId) {
                    const isDonus = t._tempId.includes('-donus');
                    const matchedItem = insertedItems.find(it => it.category === catTransfer && it.participant_id === t.participant_id && (isDonus ? it.reference_code === t.date : it.reference_code === t.date));
                    if (matchedItem) t.id = matchedItem.id;
                    delete t._tempId;
                }
            });
        }`;
code = code.replace(oldMapping, newMapping);

// Add _tempId to Ucak in servicesPayload so the mapping works
const oldUcakPush = `            servicesPayload.push({
              project_id: projectId,
              participant_id: p.id,
              category: catUcak,
              sub_category: findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi") || null,
              description: "Uçak Bileti",`;

const newUcakPush = `            servicesPayload.push({
              _tempId: \`flight-\${p.id}\`,
              project_id: projectId,
              participant_id: p.id,
              category: catUcak,
              sub_category: findSubCat([row.ucus_tipi, row.ucus_parkuru, row.havayolu, row.donus_ucus_parkuru, row.donus_havayolu], catUcak, "Uçuş Tipi") || null,
              description: "Uçak Bileti",`;

code = code.replace(oldUcakPush, newUcakPush);


// Update itemsToInsert map to drop _tempId
const oldMap = `      const itemsToInsert = servicesPayload.map(s => {
          const { id, ...rest } = s;
          return rest;
      });`;
const newMap = `      const itemsToInsert = servicesPayload.map(s => {
          const { id, _tempId, ...rest } = s;
          return rest;
      });`;
code = code.replace(oldMap, newMap);


fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed duplicates");
