const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const parseReplacement = `
        const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        let formattedData: any[] = [];

        if (dataRaw.length > 0 && dataRaw[0][0] === "KATILIMCI BİLGİLERİ") {
          // Master Template Mode
          const dataRows = dataRaw.slice(2);
          formattedData = dataRows.map((row: any) => {
            if (!row || row.length === 0) return null;
            return {
              title: row[3], 
              first_name: row[1], 
              last_name: row[2], 
              tc_passport: row[6], 
              email: row[5], 
              phone: row[4], 
              registration_type: "Delege",
              notes: row[7], 
              
              kayit_adi: row[3], 
              kayit_ucreti: parseFloat(row[34]) || 0, 
              
              konaklama_otel: row[8], 
              konaklama_checkin: parseDate(row[9]), 
              konaklama_checkout: parseDate(row[10]), 
              konaklama_oda: row[11], 
              konaklama_oda_no: "",
              konaklama_ucreti: parseFloat(row[35]) || 0, 
              
              ucus_tipi: "İç Hat",
              ucus_gidis: parseDate(row[12]), 
              ucus_gidis_saati: row[13], 
              ucus_parkuru: row[14], 
              havayolu: row[15], 
              ucus_gidis_kodu: row[16], 
              ucus_tedarikci: row[17], 
              ucus_ucreti: parseFloat(row[36]) || 0, 
              
              ucus_donus: parseDate(row[18]), 
              ucus_donus_saati: row[19], 
              donus_ucus_parkuru: row[20], 
              donus_havayolu: row[21], 
              ucus_donus_kodu: row[22], 
              donus_ucus_tedarikci: row[23], 
              donus_ucus_ucreti: parseFloat(row[37]) || 0, 
              
              transfer_gidis: parseDate(row[24]), 
              transfer_gidis_saati: row[25], 
              transfer_guzergah: row[26], 
              transfer_arac_tipi: row[27], 
              transfer_tedarikci: row[28], 
              transfer_ucreti: parseFloat(row[38]) || 0,
              
              transfer_donus: parseDate(row[29]), 
              transfer_donus_saati: row[30], 
              donus_transfer_guzergah: row[31], 
              donus_transfer_arac_tipi: row[32], 
              donus_transfer_tedarikci: row[33], 
              donus_transfer_ucreti: parseFloat(row[39]) || 0
            };
          }).filter((r: any) => r && r.first_name && r.last_name);
        } else {
          // Standard / Older Template Mode (Header based)
          const dataObj = XLSX.utils.sheet_to_json(ws);
          formattedData = dataObj.map((row: any) => {
            return {
              title: row["Unvan"] || row["title"] || "",
              first_name: row["Ad"] || row["first_name"] || row["isim"] || row["İsim"] || "",
              last_name: row["Soyad"] || row["last_name"] || row["soyisim"] || row["Soyisim"] || "",
              tc_passport: row["TC/Pasaport"] || row["tc_passport"] || row["tc"] || "",
              email: row["E-Posta"] || row["email"] || row["e-posta"] || row["E-posta"] || "",
              phone: row["Telefon"] || row["phone"] || row["telefon"] || "",
              registration_type: row["Kayıt Tipi (Sistem)"] || "Delege",
              notes: row["Özel Notlar"] || row["notes"] || row["notlar"] || row["Notlar"] || "",
              
              kayit_adi: row["Kayıt Paketi"] || row["Kayıt Tipi"] || "",
              kayit_ucreti: parseFloat(row["Kayıt Ücreti"]) || 0,
              
              konaklama_otel: row["Otel"] || row["Otel Adı"] || "",
              konaklama_checkin: parseDate(row["Giriş Tarihi"]) || parseDate(row["Check-in"]),
              konaklama_checkout: parseDate(row["Çıkış Tarihi"]) || parseDate(row["Check-out"]),
              konaklama_oda: row["Oda Tipi"] || "",
              konaklama_oda_no: row["Oda No"] || "",
              konaklama_ucreti: parseFloat(row["Konaklama Ücreti"]) || 0,
              
              ucus_tipi: row["Uçuş Tipi"] || "İç Hat",
              ucus_gidis: parseDate(row["Gidiş Uçuş Tarihi"]) || parseDate(row["Gidiş Tarihi"]) || parseDate(row["Geliş Tarihi"]),
              ucus_gidis_saati: row["Gidiş Uçuş Saati"] || row["Kalkış Saati"],
              ucus_parkuru: row["Gidiş Uçuş Parkuru"] || row["Parkur"],
              havayolu: row["Gidiş Havayolu"] || row["Havayolu"],
              ucus_gidis_kodu: row["Gidiş Uçuş Kodu"] || row["Uçuş Kodu"],
              ucus_tedarikci: row["Gidiş Uçuş Tedarikçi"] || row["Tedarikçi"],
              ucus_ucreti: parseFloat(row["Gidiş Uçuş Ücreti"]) || parseFloat(row["Geliş Uçuş Ücreti"]) || 0,
              
              ucus_donus: parseDate(row["Dönüş Uçuş Tarihi"]) || parseDate(row["Dönüş Tarihi"]),
              ucus_donus_saati: row["Dönüş Uçuş Saati"] || row["Dönüş Kalkış Saati"] || row["Dönüş Saati"],
              donus_ucus_parkuru: row["Dönüş Uçuş Parkuru"] || row["Dönüş Parkur"],
              donus_havayolu: row["Dönüş Havayolu"],
              ucus_donus_kodu: row["Dönüş Uçuş Kodu"],
              donus_ucus_tedarikci: row["Dönüş Uçuş Tedarikçi"],
              donus_ucus_ucreti: parseFloat(row["Dönüş Uçuş Ücreti"]) || 0,
              
              transfer_gidis: parseDate(row["Gidiş Transfer Tarihi"]) || parseDate(row["Geliş Transfer Tarihi"]),
              transfer_gidis_saati: row["Gidiş Transfer Saati"] || row["Geliş Transfer Saati"],
              transfer_guzergah: row["Gidiş Transfer Güzergahı"] || row["Geliş Transfer Güzergah"] || row["Güzergah"],
              transfer_arac_tipi: row["Gidiş Transfer Araç Tipi"] || row["Geliş Transfer Tipi"] || row["Araç Tipi"],
              transfer_tedarikci: row["Gidiş Transfer Tedarikçi"] || row["Geliş Transfer Tedarikçi"] || row["Tedarikçi"],
              transfer_ucreti: parseFloat(row["Gidiş Transfer Ücreti"]) || parseFloat(row["Geliş Transfer Ücreti"]) || 0,
              
              transfer_donus: parseDate(row["Dönüş Transfer Tarihi"]),
              transfer_donus_saati: row["Dönüş Transfer Saati"],
              donus_transfer_guzergah: row["Dönüş Transfer Güzergahı"] || row["Dönüş Transfer Güzergah"],
              donus_transfer_arac_tipi: row["Dönüş Transfer Araç Tipi"] || row["Dönüş Transfer Tipi"],
              donus_transfer_tedarikci: row["Dönüş Transfer Tedarikçi"],
              donus_transfer_ucreti: parseFloat(row["Dönüş Transfer Ücreti"]) || 0
            };
          }).filter((r: any) => r && r.first_name && r.last_name);
        }
`;

const parseStartStr = 'const data = XLSX.utils.sheet_to_json(ws, { header: 1 });';
const parseEndStr = '}).filter((r: any) => r && r.first_name && r.last_name);';

const pStartIdx = code.indexOf(parseStartStr);
const pEndIdx = code.indexOf(parseEndStr, pStartIdx);

if (pStartIdx !== -1 && pEndIdx !== -1) {
    code = code.substring(0, pStartIdx) + parseReplacement + code.substring(pEndIdx + parseEndStr.length);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Successfully patched parser!");
} else {
    console.error("Could not find parse block");
}
