const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const insertStartStr = 'if (sale.category === CATEGORY_UUIDS["Uçak"]) {';
const insertEndStr = 'if (transfersToInsert.length > 0) {';

const sIdx = code.indexOf(insertStartStr);
const eIdx = code.indexOf(insertEndStr, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
    const newCode = `if (sale.category === CATEGORY_UUIDS["Uçak"]) {
              flightsToInsert.push({
                id: sale.id,
                project_id: projectId,
                ucus_tipi: sale.sub_category || null,
                guzergah: row.ucus_parkuru || null,
                pnr: row.ucus_pnr || null,
                havayolu: row.havayolu || null,
                gidis_tarihi: row.ucus_gidis || null,
                gidis_saati: row.ucus_gidis_saati || null,
                gidis_ucus_kodu: row.ucus_gidis_kodu || null,
                donus_tarihi: row.ucus_donus || null,
                donus_saati: row.ucus_donus_saati || null,
                donus_ucus_kodu: row.ucus_donus_kodu || null,
                tedarikci: row.ucus_tedarikci || null,
                misafirler: \`\${participant.first_name} \${participant.last_name}\`,
                toplam_maliyet: 0,
                toplam_satis: Number(sale.total_price) || 0,
                pp_satis: Number(sale.unit_price) || 0,
                satis_doviz: sale.currency || "TRY",
                toplam_satis_tl: 0
              });
            }

            if (sale.category === CATEGORY_UUIDS["Transfer"]) {
              transfersToInsert.push({
                id: sale.id,
                project_id: projectId,
                direction: "arrival",
                type_label: "Transfer",
                transfer_type: sale.sub_category || null,
                route: row.transfer_guzergah || null,
                vehicle_type: row.transfer_arac_tipi || null,
                flight_code: null,
                supplier_name: row.transfer_tedarikci || null,
                date: row.transfer_gidis || null,
                time: row.transfer_gidis_saati || null,
                passengers: [\`\${participant.first_name} \${participant.last_name}\`],
                cost_amount: 0
              });
            }
          }

          `;
          
    code = code.substring(0, sIdx) + newCode + code.substring(eIdx);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Success restored inserts!");
} else {
    console.log("Failed to find insert block.");
}
