const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const pStartStr = 'const formattedData = dataRows.map((row: any) => {';
const pEndStr = '})).filter((r: any) => r && r.first_name && r.last_name);';

const pStartIdx = code.indexOf(pStartStr);
const pEndIdx = code.indexOf(pEndStr, pStartIdx);

if (pStartIdx !== -1 && pEndIdx !== -1) {
    const fullPEndIdx = pEndIdx + pEndStr.length;
    
    const newParse = `const formattedData = dataRows.map((row: any) => {
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
            
            kayit_adi: row[3] || "", // KAYIT TÜRÜ (D)
            kayit_ucreti: parseFloat(row[25]) || 0, // KAYIT ÜCRETİ (Z)
            
            konaklama_otel: row[26] || "", // OTEL ADI (AA)
            konaklama_oda: row[10] || "", // ODA TİPİ (K)
            konaklama_oda_no: "",
            konaklama_checkin: parseDate(row[8]), // GİRİŞ (I)
            konaklama_checkout: parseDate(row[9]), // ÇIKIŞ (J)
            konaklama_ucreti: parseFloat(row[27]) || 0, // KONAKLAMA ÜCRETİ (AB)
            
            ucus_tipi: "İç Hat",
            ucus_parkuru: (row[15] || "") + (row[21] ? " / " + row[21] : ""), // PARKUR Geliş(P) + Dönüş(V)
            ucus_pnr: row[28] || "", // PNR (AC)
            havayolu: (row[16] || "") + (row[22] && row[22] !== row[16] ? " / " + row[22] : ""), // HAVAYOLU Geliş(Q) + Dönüş(W)
            ucus_gidis: parseDate(row[12]), // GELİŞ TARİH (M)
            ucus_gidis_saati: row[13] || "", // GELİŞ KALKIŞ (N)
            ucus_gidis_kodu: row[17] || "", // GELİŞ KOD (R)
            ucus_donus: parseDate(row[18]), // DÖNÜŞ TARİH (S)
            ucus_donus_saati: row[19] || "", // DÖNÜŞ KALKIŞ (T)
            ucus_donus_kodu: row[23] || "", // DÖNÜŞ KOD (X)
            ucus_tedarikci: row[29] || "", // UÇUŞ TEDARİKÇİ (AD)
            ucus_ucreti: parseFloat(row[30]) || 0, // UÇUŞ ÜCRETİ (AE)
            
            transfer_tipi: row[31] || "", // TRANSFER YÖNÜ (AF)
            transfer_guzergah: row[32] || "", // TRANSFER GÜZERGAHI (AG)
            transfer_gidis: parseDate(row[33]), // TRANSFER GİDİŞ TARİHİ (AH)
            transfer_gidis_saati: row[34] || "", // TRANSFER GİDİŞ SAATİ (AI)
            transfer_donus: parseDate(row[35]), // TRANSFER DÖNÜŞ TARİHİ (AJ)
            transfer_donus_saati: row[36] || "", // TRANSFER DÖNÜŞ SAATİ (AK)
            transfer_arac_tipi: row[37] || "", // TRANSFER ARAÇ TİPİ (AL)
            transfer_tedarikci: row[38] || "", // TRANSFER TEDARİKÇİ (AM)
            transfer_ucreti: parseFloat(row[39]) || 0 // TRANSFER ÜCRETİ (AN)
          };
        }).filter((r: any) => r && r.first_name && r.last_name);`;
        
    code = code.substring(0, pStartIdx) + newParse + code.substring(fullPEndIdx);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Success");
} else {
    console.error("FAIL", pStartIdx, pEndIdx);
}
