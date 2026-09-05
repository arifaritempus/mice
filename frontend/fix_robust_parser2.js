const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const parseReplacement = `
        const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (!dataRaw || dataRaw.length === 0) {
          toast.error("Dosya boş.");
          return;
        }

        let formattedData: any[] = [];
        
        const firstCell = String(dataRaw[0]?.[0] || "").trim().toUpperCase();

        if (firstCell === "KATILIMCI BİLGİLERİ" || firstCell === "KATILIMCI BILGILERI") {
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
          }).filter((r: any) => r && r.first_name);
        } else {
          // Standard / Older Template Mode (Find Header Row Dynamically)
          let headerRowIndex = 0;
          let bestMatchScore = 0;
          
          for (let i = 0; i < Math.min(10, dataRaw.length); i++) {
             const row = dataRaw[i];
             if (!row) continue;
             const strRow = row.map((c: any) => String(c).toLowerCase());
             
             let score = 0;
             if (strRow.some((c: string) => c.includes("ad") || c.includes("isim") || c.includes("soyad") || c.includes("kişi") || c.includes("misafir") || c.includes("katılımcı") || c.includes("yolcu"))) score += 2;
             if (strRow.some((c: string) => c.includes("tc") || c.includes("pasaport"))) score += 1;
             if (strRow.some((c: string) => c.includes("otel") || c.includes("oda"))) score += 1;
             if (strRow.some((c: string) => c.includes("uçuş") || c.includes("tarih") || c.includes("saat"))) score += 1;
             
             if (score > bestMatchScore) {
                 bestMatchScore = score;
                 headerRowIndex = i;
             }
          }

          const headers = dataRaw[headerRowIndex].map((h: any) => String(h || "").toLocaleLowerCase('tr-TR').trim());
          const dataRows = dataRaw.slice(headerRowIndex + 1);

          formattedData = dataRows.map((rawRow: any) => {
            if (!rawRow || rawRow.length === 0) return null;
            const row: any = {};
            headers.forEach((h: string, idx: number) => {
               if (h) row[h] = rawRow[idx];
            });

            let fName = row["ad"] || row["adı"] || row["first_name"] || row["isim"] || row["i̇sim"] || row["name"] || row["kişi"] || row["kisi"] || row["misafir"] || row["yolcu"] || "";
            let lName = row["soyad"] || row["soyadı"] || row["last_name"] || row["soyisim"] || row["surname"] || "";

            if (!fName && !lName) {
                const fullName = row["ad soyad"] || row["adı soyadı"] || row["isim soyisim"] || row["katılımcı"] || row["katilimci"] || "";
                if (fullName) {
                    const parts = String(fullName).trim().split(" ");
                    lName = parts.length > 1 ? parts.pop() || "" : "";
                    fName = parts.join(" ") || fullName;
                }
            }
            
            // Eğer hala isim bulamadıysak ama Excel'de ilk kolonlarda veri varsa, acil durum kurtarması yapalım
            // Belki başlıkları yanlış koydular, bari ilk kolonu İsim kabul edelim.
            if (!fName && rawRow[0] && typeof rawRow[0] === 'string') {
               fName = rawRow[0];
            }
            
            return {
              title: row["unvan"] || row["title"] || "",
              first_name: fName,
              last_name: lName,
              tc_passport: row["tc/pasaport"] || row["tc"] || row["tc kimlik"] || row["pasaport"] || row["tc_passport"] || row["tckn"] || "",
              email: row["e-posta"] || row["email"] || row["mail"] || row["e-mail"] || "",
              phone: row["telefon"] || row["phone"] || row["tel"] || row["cep telefonu"] || row["cep tel"] || "",
              registration_type: row["kayıt tipi (sistem)"] || row["kayıt tipi"] || "Delege",
              notes: row["özel notlar"] || row["notlar"] || row["not"] || row["notes"] || row["açıklama"] || "",
              
              kayit_adi: row["kayıt paketi"] || row["kayıt tipi"] || row["kayit_adi"] || "",
              kayit_ucreti: parseFloat(row["kayıt ücreti"]) || parseFloat(row["kayıt fiyatı"]) || 0,
              
              konaklama_otel: row["otel"] || row["otel adı"] || row["hotel"] || row["konaklama"] || "",
              konaklama_checkin: parseDate(row["giriş tarihi"]) || parseDate(row["check-in"]) || parseDate(row["checkin"]) || parseDate(row["c/in"]),
              konaklama_checkout: parseDate(row["çıkış tarihi"]) || parseDate(row["check-out"]) || parseDate(row["checkout"]) || parseDate(row["c/out"]),
              konaklama_oda: row["oda tipi"] || row["oda"] || "",
              konaklama_oda_no: row["oda no"] || row["oda numarası"] || "",
              konaklama_ucreti: parseFloat(row["konaklama ücreti"]) || parseFloat(row["oda ücreti"]) || parseFloat(row["konaklama fiyatı"]) || 0,
              
              ucus_tipi: row["uçuş tipi"] || "İç Hat",
              ucus_gidis: parseDate(row["gidiş uçuş tarihi"]) || parseDate(row["gidiş tarihi"]) || parseDate(row["geliş tarihi"]) || parseDate(row["uçuş tarihi"]),
              ucus_gidis_saati: row["gidiş uçuş saati"] || row["kalkış saati"] || row["gidiş saati"] || row["uçuş saati"],
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
          }).filter((r: any) => r && r.first_name);
        }

        if (formattedData.length === 0) {
          const sampleHeaders = dataRaw.length > 0 ? dataRaw[0].slice(0, 5).join(", ") : "BOŞ";
          toast.error("Geçerli bir veri bulunamadı. Bulunan başlıklar: " + sampleHeaders.substring(0, 50));
          return;
        }
`;

const parseStartStr = '        const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];';
const parseEndStr = '        if (formattedData.length === 0) {';

const pStartIdx = code.indexOf(parseStartStr);
const pEndIdx = code.indexOf(parseEndStr, pStartIdx);

if (pStartIdx !== -1 && pEndIdx !== -1) {
    // Find the end of the if (formattedData.length === 0) block
    const blockEndStr = '          return;\n        }';
    const blockEndIdx = code.indexOf(blockEndStr, pEndIdx);
    
    code = code.substring(0, pStartIdx) + parseReplacement + code.substring(blockEndIdx + blockEndStr.length);
    fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
    console.log("Successfully replaced firmly again!");
} else {
    console.log("Not found");
}
