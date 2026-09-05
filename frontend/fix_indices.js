const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

// Fix ucus_pnr
code = code.replace(/ucus_pnr: row\[36\] \|\| "", \/\/ GELİŞ PNR \(AL\)/g, 'ucus_pnr: row[37] || "", // GELİŞ PNR (AL)');

// Fix ucus_tedarikci
code = code.replace(/ucus_tedarikci: row\[37\] \|\| "", \/\/ GELİŞ TEDARİKÇİ \(AM\)/g, 'ucus_tedarikci: row[38] || "", // GELİŞ TEDARİKÇİ (AM)');

// Fix donus_ucus_pnr
code = code.replace(/donus_ucus_pnr: row\[38\] \|\| "", \/\/ DÖNÜŞ PNR \(AN\)/g, 'donus_ucus_pnr: row[39] || "", // DÖNÜŞ PNR (AN)');

// Fix donus_ucus_tedarikci
code = code.replace(/donus_ucus_tedarikci: row\[39\] \|\| "", \/\/ DÖNÜŞ TEDARİKÇİ \(AO\)/g, 'donus_ucus_tedarikci: row[40] || "", // DÖNÜŞ TEDARİKÇİ (AO)');

// Fix kayit_ucreti
code = code.replace(/kayit_ucreti: parseFloat\(row\[40\]\) \|\| 0, \/\/ KAYIT ÜCRETİ \(AP\)/g, 'kayit_ucreti: parseFloat(row[41]) || 0, // KAYIT ÜCRETİ (AP)');

// Fix konaklama_ucreti
code = code.replace(/konaklama_ucreti: parseFloat\(row\[41\]\) \|\| 0, \/\/ KONAKLAMA ÜCRETİ \(AQ\)/g, 'konaklama_ucreti: parseFloat(row[42]) || 0, // KONAKLAMA ÜCRETİ (AQ)');

// Fix ucus_ucreti
code = code.replace(/ucus_ucreti: parseFloat\(row\[42\]\) \|\| 0, \/\/ GELİŞ UÇUŞ ÜCRETİ \(AR\)/g, 'ucus_ucreti: parseFloat(row[43]) || 0, // GELİŞ UÇUŞ ÜCRETİ (AR)');

// Fix donus_ucus_ucreti
code = code.replace(/donus_ucus_ucreti: parseFloat\(row\[43\]\) \|\| 0, \/\/ DÖNÜŞ UÇUŞ ÜCRETİ \(AS\)/g, 'donus_ucus_ucreti: parseFloat(row[44]) || 0, // DÖNÜŞ UÇUŞ ÜCRETİ (AS)');

// Fix transfer_ucreti
code = code.replace(/transfer_ucreti: parseFloat\(row\[44\]\) \|\| 0, \/\/ GELİŞ TRANSFER ÜCRETİ \(AT\)/g, 'transfer_ucreti: parseFloat(row[45]) || 0, // GELİŞ TRANSFER ÜCRETİ (AT)');

// Fix donus_transfer_ucreti
code = code.replace(/donus_transfer_ucreti: parseFloat\(row\[45\]\) \|\| 0 \/\/ DÖNÜŞ TRANSFER ÜCRETİ \(AU\)/g, 'donus_transfer_ucreti: parseFloat(row[46]) || 0 // DÖNÜŞ TRANSFER ÜCRETİ (AU)');

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
console.log("Fixed indices!");
