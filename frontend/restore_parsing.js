const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const parseRegex = /const dataRows = data\.slice\(2\);[\s\S]*?\}\)\.filter\(\(r: any\) => r && r\.first_name && r\.last_name\);/m;

const newParse = `const dataRows = data.slice(2); 

        const formattedData = dataRows.map((row: any) => {
          if (!row || row.length === 0) return null;
          
          return {
            title: row[3] || "", // KAYIT TÜRÜ (D)
            first_name: row[1] || "", // İSİM (B)
            last_name: row[2] || "", // SOYİSİM (C)
            tc_passport: row[6] || "", // TC (G)
            email: row[5] || "", // MAİL (F)
            phone: row[4] || "", // TELEFON (E)
            registration_type: "Delege",
            notes: row[24] || "", // NOTLAR (Y)
            
            kayit_adi: row[25] || "", // KAYIT PAKETİ (Z)
            kayit_ucreti: parseFloat(row[26]) || 0, // KAYIT ÜCRETİ (AA)
            
            konaklama_otel: row[27] || "", // OTEL ADI (AB)
            konaklama_oda: row[10] || "", // ODA TİPİ (K)
            konaklama_oda_no: "",
            konaklama_checkin: parseDate(row[8]), // GİRİŞ (I)
            konaklama_checkout: parseDate(row[9]), // ÇIKIŞ (J)
            konaklama_ucreti: parseFloat(row[28]) || 0, // KONAKLAMA ÜCRETİ (AC)
            
            ucus_tipi: "İç Hat",
            ucus_parkuru: (row[15] || "") + (row[21] ? " / " + row[21] : ""), // PARKUR Geliş(P) + Dönüş(V)
            ucus_pnr: row[29] || "", // PNR (AD)
            havayolu: (row[16] || "") + (row[22] && row[22] !== row[16] ? " / " + row[22] : ""), // HAVAYOLU Geliş(Q) + Dönüş(W)
            ucus_gidis: parseDate(row[12]), // GELİŞ TARİH (M)
            ucus_gidis_saati: row[13] || "", // GELİŞ KALKIŞ (N)
            ucus_gidis_kodu: row[17] || "", // GELİŞ KOD (R)
            ucus_donus: parseDate(row[18]), // DÖNÜŞ TARİH (S)
            ucus_donus_saati: row[19] || "", // DÖNÜŞ KALKIŞ (T)
            ucus_donus_kodu: row[23] || "", // DÖNÜŞ KOD (X)
            ucus_tedarikci: row[30] || "", // UÇUŞ TEDARİKÇİ (AE)
            ucus_ucreti: parseFloat(row[31]) || 0, // UÇUŞ ÜCRETİ (AF)
            
            transfer_tipi: row[32] || "", // TRANSFER YÖNÜ (AG)
            transfer_guzergah: row[33] || "", // TRANSFER GÜZERGAHI (AH)
            transfer_gidis: parseDate(row[34]), // TRANSFER GİDİŞ TARİHİ (AI)
            transfer_gidis_saati: row[35] || "", // TRANSFER GİDİŞ SAATİ (AJ)
            transfer_donus: parseDate(row[36]), // TRANSFER DÖNÜŞ TARİHİ (AK)
            transfer_donus_saati: row[37] || "", // TRANSFER DÖNÜŞ SAATİ (AL)
            transfer_arac_tipi: row[38] || "", // TRANSFER ARAÇ TİPİ (AM)
            transfer_tedarikci: row[39] || "", // TRANSFER TEDARİKÇİ (AN)
            transfer_ucreti: parseFloat(row[40]) || 0 // TRANSFER ÜCRETİ (AO)
          };
        }).filter((r: any) => r && r.first_name && r.last_name);`;

if (code.match(parseRegex)) {
  code = code.replace(parseRegex, newParse);
  fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
  console.log("Success restored parsing map!");
} else {
  console.log("Failed to match parse regex.");
}
