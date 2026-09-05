const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const tGidisOld = `                transfersToInsert.push({
                                    project_id: projectId,
                  direction: "arrival",
                  type_label: "Giriş",
                  transfer_type: findSubCat([row.transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
                  route: row.transfer_guzergah,
                  vehicle_type: row.transfer_arac_tipi || null,
                  flight_code: row.ucus_gidis_kodu || null,
                  supplier_name: findSupplier(row.transfer_tedarikci) || null,
                  date: row.transfer_gidis || null,
                  time: row.transfer_gidis_saati || null,
                  passengers: [\`\${p.first_name} \${p.last_name}\`]
                });`;

const tGidisNew = `                transfersToInsert.push({
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

const tDonusOld = `                transfersToInsert.push({
                                    project_id: projectId,
                  direction: "departure",
                  type_label: "Çıkış",
                  transfer_type: findSubCat([row.donus_transfer_arac_tipi, ""], catTransfer, "Transfer Tipi") || null,
                  route: row.donus_transfer_guzergah,
                  vehicle_type: row.donus_transfer_arac_tipi || null,
                  flight_code: row.ucus_donus_kodu || null,
                  supplier_name: findSupplier(row.donus_transfer_tedarikci) || null,
                  date: row.transfer_donus || null,
                  time: row.transfer_donus_saati || null,
                  passengers: [\`\${p.first_name} \${p.last_name}\`]
                });`;

const tDonusNew = `                transfersToInsert.push({
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

code = code.replace(tGidisOld, tGidisNew);
code = code.replace(tDonusOld, tDonusNew);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed transfers!");
