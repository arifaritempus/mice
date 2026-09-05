const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const parseStartStr = 'const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];';
const parseEndStr = '        if (formattedData.length === 0) {'; // Using this as the unambiguous end marker

const pStartIdx = code.indexOf(parseStartStr);
const pEndIdx = code.indexOf(parseEndStr, pStartIdx);

if (pStartIdx !== -1 && pEndIdx !== -1) {
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
          // Standard / Older Template Mode (Header based, case-insensitive)
          const dataObj = XLSX.utils.sheet_to_json(ws);
          formattedData = dataObj.map((rawRow: any) => {
            const row: any = {};
            for (const key in rawRow) {
               if (key) {
                   row[key.toLocaleLowerCase('tr-TR').trim()] = rawRow[key];
               }
            }
            
            return {
              title: row["unvan"] || row["title"] || "",
              first_name: row["ad"] || row["adı"] || row["first_name"] || row["isim"] || row["i̇sim"] || row["name"] || "",
              last_name: row["soyad"] || row["soyadı"] || row["last_name"] || row["soyisim"] || row["surname"] || "",
              tc_passport: row["tc/pasaport"] || row["tc"] || row["tc kimlik"] || row["pasaport"] || row["tc_passport"] || "",
              email: row["e-posta"] || row["email"] || row["mail"] || row["e-mail"] || "",
              phone: row["telefon"] || row["phone"] || row["tel"] || row["cep telefonu"] || "",
              registration_type: row["kayıt tipi (sistem)"] || row["kayıt tipi"] || "Delege",
              notes: row["özel notlar"] || row["notlar"] || row["not"] || row["notes"] || "",
              
              kayit_adi: row["kayıt paketi"] || row["kayıt tipi"] || row["kayit_adi"] || "",
              kayit_ucreti: parseFloat(row["kayıt ücreti"]) || parseFloat(row["kayıt fiyatı"]) || 0,
              
              konaklama_otel: row["otel"] || row["otel adı"] || row["hotel"] || "",
              konaklama_checkin: parseDate(row["giriş tarihi"]) || parseDate(row["check-in"]) || parseDate(row["checkin"]),
              konaklama_checkout: parseDate(row["çıkış tarihi"]) || parseDate(row["check-out"]) || parseDate(row["checkout"]),
              konaklama_oda: row["oda tipi"] || row["oda"] || "",
              konaklama_oda_no: row["oda no"] || row["oda numarası"] || "",
              konaklama_ucreti: parseFloat(row["konaklama ücreti"]) || parseFloat(row["oda ücreti"]) || 0,
              
              ucus_tipi: row["uçuş tipi"] || "İç Hat",
              ucus_gidis: parseDate(row["gidiş uçuş tarihi"]) || parseDate(row["gidiş tarihi"]) || parseDate(row["geliş tarihi"]),
              ucus_gidis_saati: row["gidiş uçuş saati"] || row["kalkış saati"] || row["gidiş saati"],
              ucus_parkuru: row["gidiş uçuş parkuru"] || row["parkur"] || row["gidiş parkuru"],
              havayolu: row["gidiş havayolu"] || row["havayolu"] || row["hava yolu"],
              ucus_gidis_kodu: row["gidiş uçuş kodu"] || row["uçuş kodu"] || row["gidiş kodu"],
              ucus_tedarikci: row["gidiş uçuş tedarikçi"] || row["tedarikçi"] || row["uçuş tedarikçi"],
              ucus_ucreti: parseFloat(row["gidiş uçuş ücreti"]) || parseFloat(row["geliş uçuş ücreti"]) || parseFloat(row["uçuş ücreti"]) || 0,
              
              ucus_donus: parseDate(row["dönüş uçuş tarihi"]) || parseDate(row["dönüş tarihi"]),
              ucus_donus_saati: row["dönüş uçuş saati"] || row["dönüş kalkış saati"] || row["dönüş saati"],
              donus_ucus_parkuru: row["dönüş uçuş parkuru"] || row["dönüş parkur"],
              donus_havayolu: row["dönüş havayolu"],
              ucus_donus_kodu: row["dönüş uçuş kodu"] || row["dönüş kodu"],
              donus_ucus_tedarikci: row["dönüş uçuş tedarikçi"],
              donus_ucus_ucreti: parseFloat(row["dönüş uçuş ücreti"]) || 0,
              
              transfer_gidis: parseDate(row["gidiş transfer tarihi"]) || parseDate(row["geliş transfer tarihi"]) || parseDate(row["transfer tarihi"]),
              transfer_gidis_saati: row["gidiş transfer saati"] || row["geliş transfer saati"] || row["transfer saati"],
              transfer_guzergah: row["gidiş transfer güzergahı"] || row["geliş transfer güzergah"] || row["güzergah"] || row["transfer güzergahı"],
              transfer_arac_tipi: row["gidiş transfer araç tipi"] || row["geliş transfer tipi"] || row["araç tipi"],
              transfer_tedarikci: row["gidiş transfer tedarikçi"] || row["geliş transfer tedarikçi"] || row["transfer tedarikçi"],
              transfer_ucreti: parseFloat(row["gidiş transfer ücreti"]) || parseFloat(row["geliş transfer ücreti"]) || parseFloat(row["transfer ücreti"]) || 0,
              
              transfer_donus: parseDate(row["dönüş transfer tarihi"]),
              transfer_donus_saati: row["dönüş transfer saati"],
              donus_transfer_guzergah: row["dönüş transfer güzergahı"] || row["dönüş transfer güzergah"],
              donus_transfer_arac_tipi: row["dönüş transfer araç tipi"] || row["dönüş transfer tipi"],
              donus_transfer_tedarikci: row["dönüş transfer tedarikçi"],
              donus_transfer_ucreti: parseFloat(row["dönüş transfer ücreti"]) || 0
            };
          }).filter((r: any) => r && r.first_name && r.last_name);
        }

`;

    code = code.substring(0, pStartIdx) + parseReplacement + code.substring(pEndIdx);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Successfully replaced cleanly!");
} else {
    console.log("Not found");
}
