const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const parseStartStr = 'const data = XLSX.utils.sheet_to_json(ws, { header: 1 });';
const parseEndStr = '}).filter((r: any) => r && r.first_name && r.last_name);';

const pStartIdx = code.indexOf(parseStartStr);
const pEndIdx = code.indexOf(parseEndStr, pStartIdx);

if (pStartIdx !== -1 && pEndIdx !== -1) {
    const fullPEndIdx = pEndIdx + parseEndStr.length;
    
    const newParse = `const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const dataRows = data.slice(2); 

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
            notes: row[47] || "", // NOTLAR (AV)
            
            kayit_adi: row[3] || "", // KAYIT TÜRÜ (D)
            kayit_ucreti: parseFloat(row[40]) || 0, // KAYIT ÜCRETİ (AP)
            
            konaklama_otel: row[8] || "", // OTEL ADI (I)
            konaklama_oda: row[11] || "", // ODA TİPİ (L)
            konaklama_oda_no: "",
            konaklama_checkin: parseDate(row[9]), // GİRİŞ (J)
            konaklama_checkout: parseDate(row[10]), // ÇIKIŞ (K)
            konaklama_ucreti: parseFloat(row[41]) || 0, // KONAKLAMA ÜCRETİ (AQ)
            
            ucus_tipi: "İç Hat",
            ucus_parkuru: row[16] || "", // GELİŞ PARKUR (Q)
            ucus_pnr: row[36] || "", // GELİŞ PNR (AL)
            havayolu: row[17] || "", // GELİŞ HAVAYOLU (R)
            ucus_gidis: parseDate(row[13]), // GELİŞ TARİH (N)
            ucus_gidis_saati: row[14] || "", // GELİŞ KALKIŞ (O)
            ucus_gidis_kodu: row[18] || "", // GELİŞ KOD (S)
            ucus_tedarikci: row[37] || "", // GELİŞ TEDARİKÇİ (AM)
            ucus_ucreti: parseFloat(row[42]) || 0, // GELİŞ UÇUŞ ÜCRETİ (AR)
            
            donus_ucus_parkuru: row[22] || "", // DÖNÜŞ PARKUR (W)
            donus_ucus_pnr: row[38] || "", // DÖNÜŞ PNR (AN)
            donus_havayolu: row[23] || "", // DÖNÜŞ HAVAYOLU (X)
            ucus_donus: parseDate(row[19]), // DÖNÜŞ TARİH (T)
            ucus_donus_saati: row[20] || "", // DÖNÜŞ KALKIŞ (U)
            ucus_donus_kodu: row[24] || "", // DÖNÜŞ KOD (Y)
            donus_ucus_tedarikci: row[39] || "", // DÖNÜŞ TEDARİKÇİ (AO)
            donus_ucus_ucreti: parseFloat(row[43]) || 0, // DÖNÜŞ UÇUŞ ÜCRETİ (AS)
            
            transfer_gidis: parseDate(row[25]), // GELİŞ TRANSFER TARİHİ (Z)
            transfer_gidis_saati: row[26] || "", // GELİŞ TRANSFER SAATİ (AA)
            transfer_tipi: row[27] || "", // GELİŞ TRANSFER YÖNÜ (AB)
            transfer_guzergah: row[28] || "", // GELİŞ TRANSFER GÜZERGAHI (AC)
            transfer_arac_tipi: row[29] || "", // GELİŞ TRANSFER ARAÇ TİPİ (AD)
            transfer_tedarikci: row[30] || "", // GELİŞ TRANSFER TEDARİKÇİ (AE)
            transfer_ucreti: parseFloat(row[44]) || 0, // GELİŞ TRANSFER ÜCRETİ (AT)
            
            transfer_donus: parseDate(row[31]), // DÖNÜŞ TRANSFER TARİHİ (AF)
            transfer_donus_saati: row[32] || "", // DÖNÜŞ TRANSFER SAATİ (AG)
            donus_transfer_tipi: row[33] || "", // DÖNÜŞ TRANSFER YÖNÜ (AH)
            donus_transfer_guzergah: row[34] || "", // DÖNÜŞ TRANSFER GÜZERGAHI (AI)
            donus_transfer_arac_tipi: row[35] || "", // DÖNÜŞ TRANSFER ARAÇ TİPİ (AJ)
            donus_transfer_tedarikci: row[36] || "", // DÖNÜŞ TRANSFER TEDARİKÇİ (AK)
            donus_transfer_ucreti: parseFloat(row[45]) || 0 // DÖNÜŞ TRANSFER ÜCRETİ (AU)
          };
        }).filter((r: any) => r && r.first_name && r.last_name);`;
        
    code = code.substring(0, pStartIdx) + newParse + code.substring(fullPEndIdx);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Success parsing map updated!");
} else {
    console.log("Failed to find parse block. start:", pStartIdx, "end:", pEndIdx);
}
