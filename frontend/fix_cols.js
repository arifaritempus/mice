const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// FLIGHTS - GİDİŞ
code = code.replace(/flightsToInsert\.push\({\n\s*_tempId: \`flight-\${p\.id}-gidis\`,\n\s*project_id: projectId,\n\s*flight_type: "Gidiş",\n\s*flight_class: row\.ucus_tipi \|\| "İç Hat",\n\s*pnr: row\.ucus_pnr \|\| null,\n\s*airline: row\.havayolu \|\| null,\n\s*departure_date: row\.ucus_gidis \|\| null,\n\s*departure_time: row\.ucus_gidis_saati \|\| null,\n\s*flight_code: row\.ucus_gidis_kodu \|\| null,\n\s*route: row\.ucus_parkuru \|\| null,\n\s*supplier_name: findSupplier\(row\.ucus_tedarikci\) \|\| null,\n\s*passengers: \[\`\${p\.first_name} \${p\.last_name}\`\]\n\s*}\);/g, 
`flightsToInsert.push({
                  _tempId: \`flight-\${p.id}-gidis\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "İç Hat",
                  pnr: row.ucus_pnr || null,
                  havayolu: row.havayolu || null,
                  gidis_tarihi: row.ucus_gidis || null,
                  gidis_saati: row.ucus_gidis_saati || null,
                  gidis_ucus_kodu: row.ucus_gidis_kodu || null,
                  guzergah: row.ucus_parkuru || null,
                  tedarikci: findSupplier(row.ucus_tedarikci) || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });`);

// FLIGHTS - DÖNÜŞ
code = code.replace(/flightsToInsert\.push\({\n\s*_tempId: \`flight-\${p\.id}-donus\`,\n\s*project_id: projectId,\n\s*flight_type: "Dönüş",\n\s*flight_class: row\.ucus_tipi \|\| "İç Hat",\n\s*pnr: row\.ucus_donus_pnr \|\| null,\n\s*airline: row\.donus_havayolu \|\| null,\n\s*departure_date: row\.ucus_donus \|\| null,\n\s*departure_time: row\.ucus_donus_saati \|\| null,\n\s*flight_code: row\.ucus_donus_kodu \|\| null,\n\s*route: row\.donus_ucus_parkuru \|\| null,\n\s*supplier_name: findSupplier\(row\.donus_ucus_tedarikci\) \|\| null,\n\s*passengers: \[\`\${p\.first_name} \${p\.last_name}\`\]\n\s*}\);/g, 
`flightsToInsert.push({
                  _tempId: \`flight-\${p.id}-donus\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "İç Hat",
                  pnr: row.ucus_donus_pnr || null,
                  havayolu: row.donus_havayolu || null,
                  donus_tarihi: row.ucus_donus || null,
                  donus_saati: row.ucus_donus_saati || null,
                  donus_ucus_kodu: row.ucus_donus_kodu || null,
                  guzergah: row.donus_ucus_parkuru || null,
                  tedarikci: findSupplier(row.donus_ucus_tedarikci) || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });`);

// TRANSFERS - GELİŞ
code = code.replace(/transfersToInsert\.push\({\n\s*_tempId: \`transfer-\${p\.id}-gidis\`,\n\s*project_id: projectId,\n\s*direction: "Geliş",\n\s*type_label: row\.transfer_arac_tipi\?\.toLowerCase\(\)\.includes\("grup"\) \? "Grup" : "Özel",\n\s*transfer_type: row\.transfer_arac_tipi \|\| null,\n\s*route: row\.transfer_guzergah \|\| null,\n\s*vehicle_type: row\.transfer_arac_tipi \|\| null,\n\s*flight_code: null,\n\s*supplier_name: row\.transfer_tedarikci \|\| null,\n\s*date: row\.transfer_gidis \|\| null,\n\s*time: row\.transfer_gidis_saati \|\| null,\n\s*passengers: \[\`\${p\.first_name} \${p\.last_name}\`\],\n\s*}\);/g, 
`transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-gidis\`,
                  project_id: projectId,
                  is_group: row.transfer_arac_tipi?.toLowerCase().includes("grup") ? true : false,
                  transfer_tipi: row.transfer_arac_tipi || null,
                  guzergah: row.transfer_guzergah || null,
                  arac_tipi: row.transfer_arac_tipi || null,
                  tedarikci: row.transfer_tedarikci || null,
                  transfer_tarihi: row.transfer_gidis || null,
                  transfer_saati: row.transfer_gidis_saati || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });`);

// TRANSFERS - DÖNÜŞ
code = code.replace(/transfersToInsert\.push\({\n\s*_tempId: \`transfer-\${p\.id}-donus\`,\n\s*project_id: projectId,\n\s*direction: "Dönüş",\n\s*type_label: row\.donus_transfer_arac_tipi\?\.toLowerCase\(\)\.includes\("grup"\) \? "Grup" : "Özel",\n\s*transfer_type: row\.donus_transfer_arac_tipi \|\| null,\n\s*route: row\.donus_transfer_guzergah \|\| null,\n\s*vehicle_type: row\.donus_transfer_arac_tipi \|\| null,\n\s*flight_code: null,\n\s*supplier_name: row\.donus_transfer_tedarikci \|\| null,\n\s*date: row\.transfer_donus \|\| null,\n\s*time: row\.transfer_donus_saati \|\| null,\n\s*passengers: \[\`\${p\.first_name} \${p\.last_name}\`\],\n\s*}\);/g, 
`transfersToInsert.push({
                  _tempId: \`transfer-\${p.id}-donus\`,
                  project_id: projectId,
                  is_group: row.donus_transfer_arac_tipi?.toLowerCase().includes("grup") ? true : false,
                  transfer_tipi: row.donus_transfer_arac_tipi || null,
                  guzergah: row.donus_transfer_guzergah || null,
                  arac_tipi: row.donus_transfer_arac_tipi || null,
                  tedarikci: row.donus_transfer_tedarikci || null,
                  transfer_tarihi: row.transfer_donus || null,
                  transfer_saati: row.transfer_donus_saati || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });`);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed columns!");
