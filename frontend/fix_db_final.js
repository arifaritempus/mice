const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const startStr = 'if (sale.category === CATEGORY_UUIDS["Uçak"]) {';
const endStr = 'cost_amount: 0\n              });\n            }';

const sIdx = code.indexOf(startStr);
const eIdx = code.indexOf(endStr, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
    const fullEndIdx = eIdx + endStr.length;
    
    const newCode = `if (sale.category === CATEGORY_UUIDS["Uçak"]) {
              const isGelis = sale.description?.startsWith("Geliş:");
              flightsToInsert.push({
                id: sale.id,
                project_id: projectId,
                ucus_tipi: sale.sub_category || null,
                guzergah: isGelis ? row.ucus_parkuru : row.donus_ucus_parkuru,
                pnr: isGelis ? row.ucus_pnr : row.donus_ucus_pnr,
                havayolu: isGelis ? row.havayolu : row.donus_havayolu,
                gidis_tarihi: isGelis ? row.ucus_gidis : row.ucus_donus,
                gidis_saati: isGelis ? row.ucus_gidis_saati : row.ucus_donus_saati,
                gidis_ucus_kodu: isGelis ? row.ucus_gidis_kodu : row.ucus_donus_kodu,
                donus_tarihi: null,
                donus_saati: null,
                donus_ucus_kodu: null,
                tedarikci: isGelis ? row.ucus_tedarikci : row.donus_ucus_tedarikci,
                misafirler: \`\${participant.first_name} \${participant.last_name}\`,
                toplam_maliyet: 0,
                toplam_satis: Number(sale.total_price) || 0,
                pp_satis: Number(sale.unit_price) || 0,
                satis_doviz: sale.currency || "TRY",
                toplam_satis_tl: 0
              });
            }

            if (sale.category === CATEGORY_UUIDS["Transfer"]) {
              const isGelis = sale.description?.startsWith("Geliş:");
              transfersToInsert.push({
                id: sale.id,
                project_id: projectId,
                transfer_type: sale.sub_category || null,
                route: isGelis ? row.transfer_guzergah : row.donus_transfer_guzergah,
                vehicle_type: isGelis ? row.transfer_arac_tipi : row.donus_transfer_arac_tipi,
                flight_code: isGelis ? row.ucus_gidis_kodu : row.ucus_donus_kodu,
                supplier_name: isGelis ? row.transfer_tedarikci : row.donus_transfer_tedarikci,
                date: isGelis ? row.transfer_gidis : row.transfer_donus,
                time: isGelis ? row.transfer_gidis_saati : row.transfer_donus_saati,
                passengers: [\`\${participant.first_name} \${participant.last_name}\`],
                cost_amount: 0
              });
            }`;
            
    code = code.substring(0, sIdx) + newCode + code.substring(fullEndIdx);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Success DB inserts updated!");
} else {
    console.log("Failed to find DB insert block. start:", sIdx, "end:", eIdx);
}
