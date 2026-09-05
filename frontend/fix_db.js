const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// Replace servicesPayload block
const spStartStr = 'if (row.ucus_gidis || row.ucus_donus) {';
const spEndStr = '          });\n        }';
const spEndStrFull = '          });\n        }\n      });'; // include transfer block end

const regexServices = /if \(row\.ucus_gidis \|\| row\.ucus_donus\) \{[\s\S]*?payer_company_id: selectedCompanyId \|\| null\n          \}\);\n        \}\n      \}\);/m;

const newServices = `if (row.ucus_gidis) {
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: CATEGORY_UUIDS["Uçak"],
            sub_category: findSubCat("İç Hat", catUcak),
            hotel_id: null,
            description: "Geliş: " + (row.ucus_parkuru || "Uçuş"),
            reference: row.ucus_gidis ? row.ucus_gidis + (row.ucus_gidis_saati ? "T" + row.ucus_gidis_saati : "") : null,
            unit_price: row.ucus_ucreti || 0,
            unit_quantity: 1,
            total_price: row.ucus_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });
        }
        if (row.ucus_donus) {
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: CATEGORY_UUIDS["Uçak"],
            sub_category: findSubCat("İç Hat", catUcak),
            hotel_id: null,
            description: "Dönüş: " + (row.donus_ucus_parkuru || "Uçuş"),
            reference: row.ucus_donus ? row.ucus_donus + (row.ucus_donus_saati ? "T" + row.ucus_donus_saati : "") : null,
            unit_price: row.donus_ucus_ucreti || 0,
            unit_quantity: 1,
            total_price: row.donus_ucus_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });
        }

        if (row.transfer_gidis) {
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: CATEGORY_UUIDS["Transfer"],
            sub_category: findSubCat(row.transfer_tipi, catTransfer),
            hotel_id: null,
            description: "Geliş: " + (row.transfer_guzergah || "Transfer"),
            reference: row.transfer_gidis ? row.transfer_gidis + (row.transfer_gidis_saati ? "T" + row.transfer_gidis_saati : "") : null,
            unit_price: row.transfer_ucreti || 0,
            unit_quantity: 1,
            total_price: row.transfer_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });
        }
        if (row.transfer_donus) {
          servicesPayload.push({
            project_id: projectId,
            participant_id: p.id,
            category: CATEGORY_UUIDS["Transfer"],
            sub_category: findSubCat(row.donus_transfer_tipi, catTransfer),
            hotel_id: null,
            description: "Dönüş: " + (row.donus_transfer_guzergah || "Transfer"),
            reference: row.transfer_donus ? row.transfer_donus + (row.transfer_donus_saati ? "T" + row.transfer_donus_saati : "") : null,
            unit_price: row.donus_transfer_ucreti || 0,
            unit_quantity: 1,
            total_price: row.donus_transfer_ucreti || 0,
            currency: currency,
            payer_company_id: selectedCompanyId || null
          });
        }
      });`;

code = code.replace(regexServices, newServices);


const regexInsert = /if \(sale\.category === CATEGORY_UUIDS\["Uçak"\]\) \{[\s\S]*?total_cost: 0\n              \}\);\n            \}/m;

const newInsert = `if (sale.category === CATEGORY_UUIDS["Uçak"]) {
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
                total_cost: 0
              });
            }`;

code = code.replace(regexInsert, newInsert);

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Patched DB insert logic for split records");
