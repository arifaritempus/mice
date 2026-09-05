const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const idx1 = code.indexOf(`            if (row.ucus_parkuru) {
                flightsToInsert.push({`);
                
const endIdx = code.indexOf(`        // Geliş Transfer`);

if (idx1 !== -1 && endIdx !== -1) {
    const before = code.substring(0, idx1);
    const after = code.substring(endIdx);
    
    const newBlock = `            // Uçak biletleri veritabanında TEK SATIRDA (Gidiş-Dönüş) tutuluyor.
            if (row.ucus_parkuru || row.donus_ucus_parkuru) {
                flightsToInsert.push({
                  _tempId: \`flight-\${p.id}\`,
                  project_id: projectId,
                  participant_id: p.id,
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
                  doviz: "EUR",
                  toplam_satis: ucusFiyat || 0
                });
            }
        }
        
`;
    code = before + newBlock + after;
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Fixed UCAK logic finally");
} else {
    console.log("Not found idx1 or endIdx", idx1, endIdx);
}
