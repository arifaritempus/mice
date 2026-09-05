const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// FLIGHTS - DÖNÜŞ
const flightDonusOld = `                flightsToInsert.push({
                  _tempId: \`flight-\${p.id}-donus\`,
                  project_id: projectId,
                  flight_type: "Dönüş",
                  flight_class: row.ucus_tipi || "İç Hat",
                  pnr: row.donus_ucus_pnr || null,
                  airline: row.donus_havayolu || null,
                  departure_date: row.ucus_donus || null,
                  departure_time: row.ucus_donus_saati || null,
                  flight_code: row.ucus_donus_kodu || null,
                  route: row.donus_ucus_parkuru || null,
                  supplier_name: findSupplier(row.donus_ucus_tedarikci) || null,
                  passengers: [\`\${p.first_name} \${p.last_name}\`]
                });`;

const flightDonusNew = `                flightsToInsert.push({
                  _tempId: \`flight-\${p.id}-donus\`,
                  project_id: projectId,
                  ucus_tipi: row.ucus_tipi || "İç Hat",
                  pnr: row.donus_ucus_pnr || null,
                  havayolu: row.donus_havayolu || null,
                  donus_tarihi: row.ucus_donus || null,
                  donus_saati: row.ucus_donus_saati || null,
                  donus_ucus_kodu: row.ucus_donus_kodu || null,
                  guzergah: row.donus_ucus_parkuru || null,
                  tedarikci: findSupplier(row.donus_ucus_tedarikci) || null,
                  misafirler: \`\${p.first_name} \${p.last_name}\`,
                  kisi_sayisi: 1,
                  doviz: "EUR"
                });`;

code = code.replace(flightDonusOld, flightDonusNew);
fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed flight donus");
