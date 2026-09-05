const fs = require('fs');
let code = fs.readFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', 'utf8');

const startStr = 'const downloadTemplate = async () => {';
const endStr = 'toast.error("Şablon oluşturulurken hata: " + err.message);\n    }\n  };';

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const fullEndIdx = endIdx + endStr.length;
    
    const newDownloadTemplate = `const downloadTemplate = async () => {
    toast.loading("Şablon hazırlanıyor...");
    try {
      const { data: cats } = await supabase.from('project_categories').select('id, name, parent_id').eq('project_id', projectId);
      const allCats = cats || [];
      
      const kayitCats = allCats.filter(c => c.parent_id === catKayit).map(c => c.name);
      const konaklamaCats = allCats.filter(c => c.parent_id === catKonaklama).map(c => c.name);
      const ucakCats = allCats.filter(c => c.parent_id === catUcak).map(c => c.name);
      const transferCats = allCats.filter(c => c.parent_id === catTransfer).map(c => c.name);

      const hotelNames = projectHotels.map(h => h.name);
      const airlines = ["THY", "AJET", "PEGASUS", "SUNEXPRESS", "CORENDON"];

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      
      const catSheet = workbook.addWorksheet('Kategoriler', { state: 'hidden' });
      catSheet.getColumn(1).values = ['Kayıt Tipleri', ...kayitCats];
      catSheet.getColumn(2).values = ['Oda Tipleri', ...konaklamaCats];
      catSheet.getColumn(3).values = ['Transfer Tipleri', ...transferCats];
      catSheet.getColumn(4).values = ['Oteller', ...hotelNames];
      catSheet.getColumn(5).values = ['Havayolları', ...airlines];

      const ws = workbook.addWorksheet('Rooming_List');
      
      // ROW 1: Merged Headers
      ws.addRow([
        "KATILIMCI BİLGİLERİ", "", "", "", "", "", "", "",
        "KONAKLAMA", "", "", "", "",
        "GELİŞ UÇUŞ", "", "", "", "", "",
        "DÖNÜŞ UÇUŞ", "", "", "", "", "",
        "OPERASYONEL / EK ALANLAR (SİSTEM İÇİN)", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);
      ws.mergeCells('A1:H1');
      ws.mergeCells('I1:M1');
      ws.mergeCells('N1:S1');
      ws.mergeCells('T1:Y1');
      ws.mergeCells('Z1:AV1');
      
      // ROW 2: Column Headers
      const headers = [
        "NO", "İSİM", "SOYİSİM", "KAYIT TÜRÜ", "TELEFON", "MAİL ADRESİ", "TC", "DOĞUM TARİHİ", // A-H
        "OTEL ADI", "GİRİŞ", "ÇIKIŞ", "ODA TİPİ", "YATAK TİPİ", // I-M
        "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // N-S (Geliş)
        "TARİH", "KALKIŞ S.", "VARIŞ S.", "PARKUR", "HAVAYOLU", "UÇUŞ KODU", // T-Y (Dönüş)
        "GELİŞ TRANSFER TARİHİ", "GELİŞ TRANSFER SAATİ", "GELİŞ TRANSFER YÖNÜ", "GELİŞ TRANSFER GÜZERGAHI", "GELİŞ TRANSFER ARAÇ TİPİ", "GELİŞ TRANSFER TEDARİKÇİ", // Z-AE
        "DÖNÜŞ TRANSFER TARİHİ", "DÖNÜŞ TRANSFER SAATİ", "DÖNÜŞ TRANSFER YÖNÜ", "DÖNÜŞ TRANSFER GÜZERGAHI", "DÖNÜŞ TRANSFER ARAÇ TİPİ", "DÖNÜŞ TRANSFER TEDARİKÇİ", // AF-AK
        "GELİŞ UÇUŞ PNR", "GELİŞ UÇUŞ TEDARİKÇİ", // AL-AM
        "DÖNÜŞ UÇUŞ PNR", "DÖNÜŞ UÇUŞ TEDARİKÇİ", // AN-AO
        "KAYIT ÜCRETİ", "KONAKLAMA ÜCRETİ", // AP-AQ
        "GELİŞ UÇUŞ ÜCRETİ", "DÖNÜŞ UÇUŞ ÜCRETİ", // AR-AS
        "GELİŞ TRANSFER ÜCRETİ", "DÖNÜŞ TRANSFER ÜCRETİ", // AT-AU
        "NOTLAR" // AV
      ];
      ws.addRow(headers);
      
      // ROW 3: Example Data
      ws.addRow([
        "1", "Ahmet", "Yılmaz", kayitCats[0] || "Hekim", "05551234567", "ahmet@test.com", "12345678901", "01.01.1980", // A-H
        hotelNames[0] || "Titanic", "12.05.2024", "15.05.2024", konaklamaCats[0] || "SINGLE ODA", "FRENCH", // I-M
        "12.05.2024", "10:30", "12:00", "IST-AYT", "THY", "TK1234", // N-S
        "15.05.2024", "14:45", "16:00", "AYT-IST", "AJET", "VF1235", // T-Y
        "12.05.2024", "12:00", transferCats[0] || "Havalimanı-Otel", "AYT - Titanic", "Vito", "VIP Transfer", // Z-AE
        "15.05.2024", "12:00", transferCats[0] || "Otel-Havalimanı", "Titanic - AYT", "Midibus", "VIP Transfer", // AF-AK
        "P12345", "ETS", // AL-AM
        "P12346", "ETS", // AN-AO
        300, 450, // AP-AQ
        50, 50, // AR-AS
        25, 25, // AT-AU
        "Vejetaryen" // AV
      ]);

      // Styling Row 1 (Merged Headers)
      const r1 = ws.getRow(1);
      r1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      r1.alignment = { horizontal: 'center', vertical: 'middle' };
      r1.height = 25;
      
      ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800000' } };
      ws.getCell('I1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
      ws.getCell('N1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
      ws.getCell('T1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
      ws.getCell('Z1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };

      // Styling Row 2 (Columns)
      const r2 = ws.getRow(2);
      r2.font = { bold: true };
      
      // SADECE DOLU HÜCRELERE RENK VER (A2 to AV2)
      for (let c = 1; c <= 48; c++) {
        ws.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      }
      
      // Auto-fit columns
      ws.columns.forEach((col, idx) => { 
        if (idx < 48) col.width = 15; 
      });

      // Data Validation
      for (let i = 3; i <= 1000; i++) {
        // KAYIT TÜRÜ (D)
        if (kayitCats.length > 0) ws.getCell(\`D\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$A$2:$A$\${kayitCats.length + 1}\`] };
        // OTEL ADI (I)
        if (hotelNames.length > 0) ws.getCell(\`I\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$D$2:$D$\${hotelNames.length + 1}\`] };
        // ODA TİPİ (L)
        if (konaklamaCats.length > 0) ws.getCell(\`L\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$B$2:$B$\${konaklamaCats.length + 1}\`] };
        // HAVAYOLU GELİŞ (R)
        ws.getCell(\`R\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$E$2:$E$6\`] };
        // HAVAYOLU DÖNÜŞ (X)
        ws.getCell(\`X\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$E$2:$E$6\`] };
        
        // GELİŞ TRANSFER YÖNÜ (AB)
        if (transferCats.length > 0) ws.getCell(\`AB\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$C$2:$C$\${transferCats.length + 1}\`] };
        // DÖNÜŞ TRANSFER YÖNÜ (AH)
        if (transferCats.length > 0) ws.getCell(\`AH\${i}\`).dataValidation = { type: 'list', allowBlank: true, formulae: [\`'Kategoriler'!$C$2:$C$\${transferCats.length + 1}\`] };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Katilimci_Rooming_Listesi.xlsx";
      a.click();
      toast.dismiss();
      toast.success("Şablon başarıyla indirildi.");
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error("Şablon oluşturulurken hata: " + err.message);
    }
  };`;

    code = code.substring(0, startIdx) + newDownloadTemplate + code.substring(fullEndIdx);
}

const parseStartStr = 'const data = XLSX.utils.sheet_to_json(ws, { header: 1 });';
const parseEndStr = '})).filter((r: any) => r && r.first_name && r.last_name);';

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
            kayit_ucreti: parseFloat(row[41]) || 0, // KAYIT ÜCRETİ (AP)
            
            konaklama_otel: row[8] || "", // OTEL ADI (I)
            konaklama_oda: row[11] || "", // ODA TİPİ (L)
            konaklama_oda_no: "",
            konaklama_checkin: parseDate(row[9]), // GİRİŞ (J)
            konaklama_checkout: parseDate(row[10]), // ÇIKIŞ (K)
            konaklama_ucreti: parseFloat(row[42]) || 0, // KONAKLAMA ÜCRETİ (AQ)
            
            ucus_tipi: "İç Hat",
            ucus_parkuru: row[16] || "", // GELİŞ PARKUR (Q)
            ucus_pnr: row[37] || "", // GELİŞ PNR (AL)
            havayolu: row[17] || "", // GELİŞ HAVAYOLU (R)
            ucus_gidis: parseDate(row[13]), // GELİŞ TARİH (N)
            ucus_gidis_saati: row[14] || "", // GELİŞ KALKIŞ (O)
            ucus_gidis_kodu: row[18] || "", // GELİŞ KOD (S)
            ucus_tedarikci: row[38] || "", // GELİŞ TEDARİKÇİ (AM)
            ucus_ucreti: parseFloat(row[43]) || 0, // GELİŞ UÇUŞ ÜCRETİ (AR)
            
            donus_ucus_parkuru: row[22] || "", // DÖNÜŞ PARKUR (W)
            donus_ucus_pnr: row[39] || "", // DÖNÜŞ PNR (AN)
            donus_havayolu: row[23] || "", // DÖNÜŞ HAVAYOLU (X)
            ucus_donus: parseDate(row[19]), // DÖNÜŞ TARİH (T)
            ucus_donus_saati: row[20] || "", // DÖNÜŞ KALKIŞ (U)
            ucus_donus_kodu: row[24] || "", // DÖNÜŞ KOD (Y)
            donus_ucus_tedarikci: row[40] || "", // DÖNÜŞ TEDARİKÇİ (AO)
            donus_ucus_ucreti: parseFloat(row[44]) || 0, // DÖNÜŞ UÇUŞ ÜCRETİ (AS)
            
            transfer_gidis: parseDate(row[25]), // GELİŞ TRANSFER TARİHİ (Z)
            transfer_gidis_saati: row[26] || "", // GELİŞ TRANSFER SAATİ (AA)
            transfer_tipi: row[27] || "", // GELİŞ TRANSFER YÖNÜ (AB)
            transfer_guzergah: row[28] || "", // GELİŞ TRANSFER GÜZERGAHI (AC)
            transfer_arac_tipi: row[29] || "", // GELİŞ TRANSFER ARAÇ TİPİ (AD)
            transfer_tedarikci: row[30] || "", // GELİŞ TRANSFER TEDARİKÇİ (AE)
            transfer_ucreti: parseFloat(row[45]) || 0, // GELİŞ TRANSFER ÜCRETİ (AT)
            
            transfer_donus: parseDate(row[31]), // DÖNÜŞ TRANSFER TARİHİ (AF)
            transfer_donus_saati: row[32] || "", // DÖNÜŞ TRANSFER SAATİ (AG)
            donus_transfer_tipi: row[33] || "", // DÖNÜŞ TRANSFER YÖNÜ (AH)
            donus_transfer_guzergah: row[34] || "", // DÖNÜŞ TRANSFER GÜZERGAHI (AI)
            donus_transfer_arac_tipi: row[35] || "", // DÖNÜŞ TRANSFER ARAÇ TİPİ (AJ)
            donus_transfer_tedarikci: row[36] || "", // DÖNÜŞ TRANSFER TEDARİKÇİ (AK)
            donus_transfer_ucreti: parseFloat(row[46]) || 0 // DÖNÜŞ TRANSFER ÜCRETİ (AU)
          };
        }).filter((r: any) => r && r.first_name && r.last_name);`;
        
    code = code.substring(0, pStartIdx) + newParse + code.substring(fullPEndIdx);
}

fs.writeFileSync('src/app/projects/[id]/CongressParticipantBulkModal.tsx', code);
